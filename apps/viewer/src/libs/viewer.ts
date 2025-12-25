import type { Lane, OpenDrive, ReferenceLine, Road } from 'opendrive-parser'
import type { Material } from 'three'
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, NormalBlending, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import { ThreePerf } from 'three-perf'
import { Line2, LineGeometry, LineMaterial, OrbitControls } from 'three/examples/jsm/Addons.js'
import HighlightManager from './highlight-manager'
import { boundaryToArea } from './utils'
import ViewManager from './view-manager'

const isDev = import.meta.env.DEV

export type RoadMesh = Mesh<BufferGeometry, MeshBasicMaterial>

class Viewer {
  private pref?: ThreePerf
  private width: number
  private height: number
  private pixelRatio: number
  private dom: HTMLDivElement
  public scene: Scene
  public camera: PerspectiveCamera
  private renderer: WebGLRenderer
  public controls: OrbitControls
  private raycaster: Raycaster
  private mouse: Vector2

  private isMouseOverCanvas: boolean = false

  public openDrive: OpenDrive | null = null
  public roadGroup: Group
  public roadmarkGroup: Group
  public referenceLineGroup: Group

  public hm: HighlightManager
  public vm: ViewManager

  constructor(dom: HTMLDivElement) {
    this.dom = dom
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.pixelRatio = Math.min(window.devicePixelRatio, 2)
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(
      75,
      this.width / this.height,
      0.001,
      10000,
    )
    this.camera.position.set(0, 30, 30)
    this.scene.add(this.camera)

    this.renderer = new WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
    })
    this.dom.appendChild(this.renderer.domElement)

    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(this.pixelRatio)
    this.renderer.setClearColor(0x1F1F27, 1)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = false

    this.raycaster = new Raycaster()
    this.mouse = new Vector2()

    this.roadGroup = new Group()
    this.roadGroup.name = 'roads'
    this.roadmarkGroup = new Group()
    this.roadmarkGroup.name = 'roadmarks'
    this.referenceLineGroup = new Group()
    this.referenceLineGroup.name = 'reference-lines'

    this.hm = new HighlightManager(this)
    this.vm = new ViewManager(this)

    if (isDev) {
      this.pref = new ThreePerf({
        domElement: document.body,
        renderer: this.renderer,
        anchorX: 'left',
        anchorY: 'bottom',
      })
    }

    this.resize()
    this.bindEvents()
    this.animate()
  }

  bindEvents() {
    this.dom.addEventListener('mouseenter', () => {
      this.isMouseOverCanvas = true
    })
    this.dom.addEventListener('mouseleave', () => {
      this.isMouseOverCanvas = false
      // this.hm.clear('canvas')
    })
    this.dom.addEventListener('mousemove', (event) => {
      if (event.target !== this.renderer.domElement)
        return
      this.mouse.x = (event.clientX / this.dom.clientWidth) * 2 - 1
      this.mouse.y = -(event.clientY / this.dom.clientHeight) * 2 + 1
    })
  }

  resize(): void {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth
      this.height = window.innerHeight

      this.camera.aspect = this.width / this.height
      this.camera.updateProjectionMatrix()

      this.renderer.setSize(this.width, this.height)
      this.renderer.setPixelRatio(this.pixelRatio)
    })
  }

  animate(): void {
    this.pref?.begin()
    this.renderer.render(this.scene, this.camera)
    this.controls.update()
    window.requestAnimationFrame(this.animate.bind(this))
    this.pref?.end()

    if (!this.isMouseOverCanvas) {
      return
    }

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.roadGroup.children, true)
    if (intersects.length) {
      const intersected = intersects[0]!.object as RoadMesh
      const position = intersects[0]?.point
      if (!position)
        return

      this.hm.setHighlight('lane', intersected.name, 'canvas', position)
    }
    else {
      this.hm.clear('canvas')
    }
  }

  // set OpenDRIVE data
  setOpenDrive(openDrive: OpenDrive) {
    this.openDrive = openDrive
    this.addReferenceLines(openDrive.getReferenceLines())
    this.addRoads(openDrive.getRoads())
  }

  addReferenceLines(referenceLines: ReferenceLine[]): void {
    const material = new LineMaterial({
      depthTest: true,
      depthWrite: false,
      color: 0xE68816, // #e68816ff
      linewidth: 1,
      opacity: 0.6,
      transparent: true,
      dashed: true,
      dashSize: 100,
      gapSize: 50,
      blending: NormalBlending,
    })
    for (const referenceLine of referenceLines) {
      const positions = referenceLine.getPoints().map(p => new Vector3(p.x, p.z, -p.y))
      if (positions.length < 2)
        continue

      const geometry = new LineGeometry().setFromPoints(positions)
      const line = new Line2(geometry, material)
      line.translateY(0.02)
      this.referenceLineGroup.add(line)
    }
    this.scene.add(this.referenceLineGroup)
  }

  addRoads(roads: Road[]): void {
    const laneAreaMaterial = new MeshBasicMaterial({
      color: 0xB3B3B3, // #b3b3b3ff
      side: DoubleSide,
      depthTest: true,
      depthWrite: false,
    })
    const laneBoundaryMaterial = new LineMaterial({
      depthTest: true,
      depthWrite: false,
      color: 0xFFFFFF,
      linewidth: 1,
      opacity: 1.0,
      transparent: true,
      blending: NormalBlending,
    })

    for (const road of roads) {
      const laneSections = road.getLaneSections()
      for (const section of laneSections) {
        const lanes = section.getLanes()
        for (const lane of lanes) {
          this.addLaneArea(lane, road.id, section.s, laneAreaMaterial)
          this.addLaneBoundary(lane, road.id, section.s, laneBoundaryMaterial)
        }
      }
    }
    this.scene.add(this.roadGroup)
    this.scene.add(this.roadmarkGroup)
  }

  addLaneArea(lane: Lane, roadId: string, sectionS: number, material: MeshBasicMaterial) {
    const boundary = lane.getBoundary()
    const { vertices, indices } = boundaryToArea(boundary)
    const positions = new Float32Array(vertices.length)
    for (let i = 0; i < vertices.length / 3; i++) {
      positions[i * 3] = vertices[i * 3]!
      positions[i * 3 + 1] = vertices[i * 3 + 2]!
      positions[i * 3 + 2] = -vertices[i * 3 + 1]!
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    const mesh = new Mesh(geometry, material)
    mesh.name = `${roadId}_${sectionS}_${lane.id}`
    this.roadGroup.add(mesh)
  }

  addLaneBoundary(lane: Lane, roadId: string, sectionS: number, material: LineMaterial) {
    const boundaryLine = lane.getBoundaryLine()
    const boundaryPositions = boundaryLine.map(p => new Vector3(p[0], p[2], -p[1]))
    if (boundaryPositions.length < 2) {
      return
    }

    const geometry = new LineGeometry().setFromPoints(boundaryPositions)

    const line = new Line2(geometry, material)
    line.name = `${roadId}_${sectionS}_${lane.id}`
    this.roadmarkGroup.add(line)
  }

  private disposeGroup(group: Group) {
    group.traverse((obj: any) => {
      if (obj.geometry)
        obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material))
          obj.material.forEach((m: Material) => m.dispose())
        else obj.material.dispose()
      }
    })
    group.clear()
  }

  clear() {
    this.disposeGroup(this.roadGroup)
    this.disposeGroup(this.roadmarkGroup)
    this.disposeGroup(this.referenceLineGroup)
    this.scene.remove(this.roadGroup, this.roadmarkGroup, this.referenceLineGroup)
    this.vm.clear()
  }
}

export default Viewer
