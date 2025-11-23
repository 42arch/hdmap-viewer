import type { Lane, ReferenceLine, Road } from 'opendrive-parser'
import { AxesHelper, BufferGeometry, Clock, DoubleSide, Float32BufferAttribute, GridHelper, Group, InstancedMesh, Mesh, MeshBasicMaterial, NormalBlending, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import { BufferGeometryUtils, Line2, LineGeometry, LineMaterial, OrbitControls } from 'three/examples/jsm/Addons.js'
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

  private isMouseOverCanvas: boolean = false

  private roads: Road[] = []
  private laneGroup: Group
  private laneBoundaryGroup: Group
  private hightlightRoad: LaneAreaMesh | null = null
  private hightlightLane: LaneAreaMesh | null = null
  private hightlightSection: LaneAreaMesh | null = null

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
    const delta = this.clock.getDelta()

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
    window.requestAnimationFrame(this.animate.bind(this))

    if (!this.isMouseOverCanvas)
      return

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.laneGroup.children, false)
    if (intersects.length) {
      const intersected = intersects[0]!.object as Mesh<BufferGeometry, MeshBasicMaterial>

      if (intersected.name !== this.hightlightLane?.name) {
        this.clearHighlightRoad()
        this.clearHighlightLane()
        const roadId = intersected.name.split('-')[0]!
        const sectionS = Number(intersected.name.split('-')[1])
        this.setHighlightRoad(roadId)
        this.setHighlightLane(intersected.name)
      }
    }
    else {
      this.clearHighlightLane()
      this.clearHighlightRoad()
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

  addRoads(roads: Road[]): void {
    this.roads = roads
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
    mesh.name = `${roadId}-${sectionS}-${lane.id}`
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
    line.name = `${roadId}-${sectionS}-${lane.id}`
    this.laneBoundaryGroup.add(line)
  }

  addLanes(roads: Road[]): void {
    const group = new Group()
    group.name = 'lanes'
    const material = new LineMaterial({
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
      for (const laneSection of laneSections) {
        const lanes = laneSection.getLanes()

        for (const lane of lanes) {
          const boundaryLine = lane.getBoundaryLine()
          const boundaryPositions = boundaryLine.map(p => new Vector3(p[0], p[2], -p[1]))
          if (boundaryPositions.length < 2)
            continue

          const geometry = new LineGeometry().setFromPoints(boundaryPositions)

          const line = new Line2(geometry, material)
          group.add(line)
        }
      }
    }
    group.position.y = group.position.y + 0.01
    this.scene.add(group)
  }

  clearHighlightRoad() {
    if (this.hightlightRoad) {
      this.scene.remove(this.hightlightRoad)
      this.hightlightRoad.geometry.dispose()
      this.hightlightRoad.material.dispose()
      this.hightlightRoad = null
    }
  }

  setHighlightRoad(roadId: string | null) {
    if (!roadId) {
      this.clearHighlightRoad()
      return
    }

    const road = this.roads.find(r => r.id === roadId)
    if (!road) {
      return
    }

    const laneGeometries = []
    const laneSections = road.getLaneSections()
    const laneNames = laneSections.flatMap(section => section.getLanes().map(lane => `${roadId}-${section.s}-${lane.id}`))

    for (const laneName of laneNames) {
      const mesh = this.laneGroup.getObjectByName(laneName) as LaneAreaMesh
      const clonedMesh = mesh.clone()
      clonedMesh.position.y += 0.001
      laneGeometries.push(clonedMesh.geometry)
    }

    const merged = BufferGeometryUtils.mergeGeometries(laneGeometries)
    const material = new MeshBasicMaterial({
      color: 0x3867D6,
      side: DoubleSide,
      depthWrite: false,
      depthTest: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })
    this.hightlightRoad = new Mesh(merged, material)
    this.hightlightRoad.name = roadId
    this.scene.add(this.hightlightRoad)
  }

  clearHighlightSection() {
    if (this.hightlightSection) {
      this.scene.remove(this.hightlightSection)
      this.hightlightSection.geometry.dispose()
      this.hightlightSection.material.dispose()
      this.hightlightSection = null
    }
  }

  setHighlightSection(laneSectionS: string | null) {
    if (!laneSectionS) {
      this.clearHighlightSection()
      return
    }

    const mesh = this.laneGroup.getObjectByName(laneSectionS) as LaneAreaMesh

    this.hightlightSection = mesh.clone()
    this.hightlightSection.material = this.hightlightSection.material.clone()
    this.hightlightSection.material.color.set(0x45AAF2)

    this.hightlightSection.position.y += 0.001
    this.scene.add(this.hightlightSection)
  }

  setHighlightLane(laneId: string | null) {
    if (!laneId) {
      this.clearHighlightLane()
      return
    }

    const mesh = this.laneGroup.getObjectByName(laneId) as LaneAreaMesh

    this.hightlightLane = mesh.clone()
    this.hightlightLane.material = this.hightlightLane.material.clone()
    this.hightlightLane.material.color.set(0x45AAF2)

    this.hightlightLane.position.y += 0.001
    this.scene.add(this.hightlightLane)
  }

  clearHighlightLane() {
    if (this.hightlightLane) {
      this.scene.remove(this.hightlightLane)
      this.hightlightLane.geometry.dispose()
      this.hightlightLane.material.dispose()
      this.hightlightLane = null
    }
  }

  clear() {
    this.laneGroup.clear()
    this.scene.remove(this.laneGroup)
    this.scene.clear()
  }
}

export default Viewer
