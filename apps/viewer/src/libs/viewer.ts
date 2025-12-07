import type { Lane, OpenDrive, ReferenceLine, Road } from 'opendrive-parser'
import { AxesHelper, BufferGeometry, Clock, DoubleSide, Float32BufferAttribute, GridHelper, Group, Mesh, MeshBasicMaterial, NormalBlending, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import { Line2, LineGeometry, LineMaterial, OrbitControls } from 'three/examples/jsm/Addons.js'
import HighlightManager from './highlight-manager'
import { boundaryToArea } from './utils'

export type LaneAreaMesh = Mesh<BufferGeometry, MeshBasicMaterial>

class Viewer {
  private width: number
  private height: number
  private pixelRatio: number
  private dom: HTMLDivElement
  public scene: Scene
  private camera: PerspectiveCamera
  private renderer: WebGLRenderer
  private controls: OrbitControls
  private clock: Clock
  private raycaster: Raycaster
  private mouse: Vector2

  private isMouseOverCanvas: boolean = false

  public openDrive: OpenDrive | null = null
  public laneGroup: Group
  private laneBoundaryGroup: Group
  private helperGroup: Group

  public hm: HighlightManager

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
    this.camera.position.set(10, 20, 40)
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

    this.clock = new Clock()
    this.raycaster = new Raycaster()
    this.mouse = new Vector2()

    this.laneGroup = new Group()
    this.laneGroup.name = 'lanes'
    this.laneBoundaryGroup = new Group()
    this.laneBoundaryGroup.name = 'laneBoundaries'
    this.helperGroup = new Group()
    this.helperGroup.name = 'helpers'
    this.scene.add(this.helperGroup)

    this.hm = new HighlightManager(this)

    this.addHelper()
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
      this.hm.clear('canvas')
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
    // const delta = this.clock.getDelta()
    this.renderer.render(this.scene, this.camera)
    this.controls.update()
    window.requestAnimationFrame(this.animate.bind(this))

    if (!this.isMouseOverCanvas) {
      return
    }

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.laneGroup.children, false)
    if (intersects.length) {
      const intersected = intersects[0]!.object as LaneAreaMesh
      this.hm.setHighlight('lane', intersected.name, 'canvas')
    }
    else {
      this.hm.clear('canvas')
    }
  }

  addHelper(): void {
    const axesHelper = new AxesHelper(10)
    axesHelper.translateY(0.01)
    const gridHelper = new GridHelper(100, 10, 0x303030, 0x303030)
    gridHelper.translateY(-0.01)
    this.helperGroup.add(gridHelper)
    this.helperGroup.add(axesHelper)
  }

  // set OpenDRIVE data
  setOpenDrive(openDrive: OpenDrive) {
    this.openDrive = openDrive
    this.addReferenceLines(openDrive.getReferenceLines())
    this.addRoads(openDrive.getRoads())
  }

  addReferenceLines(referenceLines: ReferenceLine[]): void {
    const group = new Group()
    group.name = 'referenceLines'

    for (const referenceLine of referenceLines) {
      const positions = referenceLine.map(p => new Vector3(p.x, p.z, -p.y))
      if (positions.length < 2)
        continue

      const geometry = new LineGeometry().setFromPoints(positions)
      const material = new LineMaterial({
        depthTest: true,
        depthWrite: false,
        color: 0xFFFF00,
        linewidth: 1,
      })
      const line = new Line2(geometry, material)
      group.add(line)
    }
    this.scene.add(group)
  }

  addRoads(roads: Road[]): void {
    // this.roads = roads
    for (const road of roads) {
      const laneSections = road.getLaneSections()
      for (const section of laneSections) {
        const lanes = section.getLanes()
        for (const lane of lanes) {
          this.addLaneArea(lane, road.id, section.s)
          this.addLaneBoundary(lane, road.id, section.s)
        }
      }
    }
    this.scene.add(this.laneGroup)
    this.scene.add(this.laneBoundaryGroup)
  }

  addLaneArea(lane: Lane, roadId: string, sectionS: number) {
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
    const material = new MeshBasicMaterial({
      color: 0xCCCCCC,
      side: DoubleSide,
      depthWrite: false,
      depthTest: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })
    const mesh = new Mesh(geometry, material)
    mesh.name = `${roadId}_${sectionS}_${lane.id}`
    this.laneGroup.add(mesh)
  }

  addLaneBoundary(lane: Lane, roadId: string, sectionS: number) {
    const boundaryLine = lane.getBoundaryLine()
    const boundaryPositions = boundaryLine.map(p => new Vector3(p[0], p[2], -p[1]))
    if (boundaryPositions.length < 2) {
      return
    }

    const geometry = new LineGeometry().setFromPoints(boundaryPositions)
    const material = new LineMaterial({
      depthTest: true,
      depthWrite: false,
      color: 0xFFFFFF,
      linewidth: 1,
      opacity: 1.0,
      transparent: true,
      blending: NormalBlending,
    })
    const line = new Line2(geometry, material)
    line.name = `${roadId}_${sectionS}_${lane.id}`
    this.laneBoundaryGroup.add(line)
  }

  // addLanes(roads: Road[]): void {
  //   const group = new Group()
  //   group.name = 'lanes'
  //   const material = new LineMaterial({
  //     depthTest: true,
  //     depthWrite: false,
  //     color: 0xFFFFFF,
  //     linewidth: 1,
  //     opacity: 1.0,
  //     transparent: true,
  //     blending: NormalBlending,
  //   })

  //   for (const road of roads) {
  //     const laneSections = road.getLaneSections()
  //     for (const laneSection of laneSections) {
  //       const lanes = laneSection.getLanes()

  //       for (const lane of lanes) {
  //         const boundaryLine = lane.getBoundaryLine()
  //         const boundaryPositions = boundaryLine.map(p => new Vector3(p[0], p[2], -p[1]))
  //         if (boundaryPositions.length < 2)
  //           continue

  //         const geometry = new LineGeometry().setFromPoints(boundaryPositions)

  //         const line = new Line2(geometry, material)
  //         group.add(line)
  //       }
  //     }
  //   }
  //   group.position.y = group.position.y + 0.01
  //   this.scene.add(group)
  // }

  clear() {
    this.laneGroup.clear()
    this.laneBoundaryGroup.clear()
    this.scene.remove(this.laneGroup)
    this.scene.remove(this.laneBoundaryGroup)
    // this.scene.clear()
  }
}

export default Viewer
