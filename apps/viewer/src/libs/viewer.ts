import type { ReferenceLine, Road } from 'opendrive-parser'
import { AxesHelper, BufferGeometry, Clock, DoubleSide, Float32BufferAttribute, GridHelper, Group, Mesh, MeshBasicMaterial, NormalBlending, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import { Line2, LineGeometry, LineMaterial, OrbitControls } from 'three/examples/jsm/Addons.js'
import { boundaryToArea } from './utils'

type LaneAreaMesh = Mesh<BufferGeometry, MeshBasicMaterial>

class Viewer {
  private width: number
  private height: number
  private pixelRatio: number
  private dom: HTMLDivElement
  private scene: Scene
  private camera: PerspectiveCamera
  private renderer: WebGLRenderer
  private controls: OrbitControls
  private clock: Clock
  private raycaster: Raycaster
  private mouse: Vector2

  private laneAreasGroup: Group
  private hoveredLaneArea: LaneAreaMesh | null = null
  private selectedLaneArea: LaneAreaMesh | null = null

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

    this.laneAreasGroup = new Group()
    this.laneAreasGroup.name = 'laneAreas'

    this.addHelper()
    this.resize()
    this.bindEvents()
    this.animate()
  }

  bindEvents() {
    window.addEventListener('mousemove', (event) => {
      if (event.target !== this.renderer.domElement)
        return
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
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
    const delta = this.clock.getDelta()

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
    window.requestAnimationFrame(this.animate.bind(this))

    if (this.selectedLaneArea) {
      this.selectedLaneArea.material.color.set(0x45AAF2)
    }

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.laneAreasGroup.children, false)
    if (intersects.length) {
      const intersected = intersects[0]!.object as Mesh<BufferGeometry, MeshBasicMaterial>
      if (intersected !== this.hoveredLaneArea) {
        if (this.hoveredLaneArea) {
          this.hoveredLaneArea.material.color.set(0xCCCCCC)
        }
        this.hoveredLaneArea = intersected
        this.hoveredLaneArea.material.color.set(0x45AAF2)
      }
    }
    else {
      if (this.hoveredLaneArea) {
        this.hoveredLaneArea.material.color.set(0xCCCCCC)
        this.hoveredLaneArea = null
      }
    }
  }

  addHelper(): void {
    const axesHelper = new AxesHelper(100)
    axesHelper.translateY(0.01)
    const gridHelper = new GridHelper(1000, 10, 0x303030, 0x303030)
    gridHelper.translateY(-0.01)
    this.scene.add(gridHelper)
    // this.scene.add(axesHelper)
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

  addLaneAreas(roads: Road[]): void {
    for (const road of roads) {
      const laneSections = road.getLaneSections()
      for (const section of laneSections) {
        const lanes = section.getLanes()

        for (const lane of lanes) {
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
          mesh.name = `${road.id}-${section.s}-${lane.id}`
          this.laneAreasGroup.add(mesh)
        }
      }
    }

    this.scene.add(this.laneAreasGroup)
  }

  addLanes(roads: Road[]): void {
    const group = new Group()
    group.name = 'lanes'

    for (const road of roads) {
      const laneSections = road.getLaneSections()
      for (const laneSection of laneSections) {
        const lanes = laneSection.getLanes()

        for (const lane of lanes) {
          const boundaryLine = lane.getBoundaryLine()
          const boundaryPositions = boundaryLine.map(p => new Vector3(p[0], p[2], -p[1]))
          if (boundaryPositions.length < 2)
            continue

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
          group.add(line)
        }
      }
    }
    group.position.y = group.position.y + 0.01
    this.scene.add(group)
  }

  setSelectedLane(laneId: string | null) {
    if (!laneId) {
      this.selectedLaneArea?.material.color.set(0xCCCCCC)
      this.selectedLaneArea = null
      return
    }

    const mesh = this.laneAreasGroup.getObjectByName(laneId) as LaneAreaMesh
    if (mesh) {
      if (this.selectedLaneArea) {
        this.selectedLaneArea.material.color.set(0xCCCCCC)
      }
      this.selectedLaneArea = mesh
    }
  }

  clear() {
    this.laneAreasGroup.clear()
    this.scene.remove(this.laneAreasGroup)
    this.scene.clear()
  }
}

export default Viewer
