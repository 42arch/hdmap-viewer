import type { Lane, OpenDrive, ReferenceLine, Road } from 'opendrive-parser'
import type { Material } from 'three'
import { BufferAttribute, BufferGeometry, DoubleSide, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, NormalBlending, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'
import { BufferGeometryUtils, OrbitControls } from 'three/examples/jsm/Addons.js'
import HighlightManager from './highlight-manager'
import { boundaryToArea } from './utils'
import ViewManager from './view-manager'

// Extend BufferGeometry and Mesh with BVH methods
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
Mesh.prototype.raycast = acceleratedRaycast

export type RoadMesh = Mesh<BufferGeometry, MeshBasicMaterial>

class Viewer {
  private width: number
  private height: number
  private pixelRatio: number
  private dom: HTMLDivElement
  public scene: Scene
  public camera: PerspectiveCamera
  public renderer: WebGLRenderer
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

  private laneIdMap: string[] = []

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

    this.raycaster.firstHitOnly = true
    this.mouse = new Vector2()

    this.roadGroup = new Group()
    this.roadGroup.name = 'roads'
    this.roadmarkGroup = new Group()
    this.roadmarkGroup.name = 'roadmarks'
    this.referenceLineGroup = new Group()
    this.referenceLineGroup.name = 'reference-lines'

    this.hm = new HighlightManager(this)
    this.vm = new ViewManager(this)

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
    this.vm.begin()
    this.renderer.render(this.scene, this.camera)
    this.controls.update()
    window.requestAnimationFrame(this.animate.bind(this))
    this.vm.end()

    if (!this.isMouseOverCanvas) {
      return
    }

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.roadGroup.children, true)
    if (intersects.length) {
      const intersection = intersects[0]
      if (!intersection)
        return

      const object = intersection.object as Mesh
      const faceIndex = intersection.faceIndex

      if (faceIndex !== undefined && object.geometry.getAttribute('laneIndex')) {
        const laneIndexAttr = object.geometry.getAttribute('laneIndex')
        const a = intersection.face?.a
        if (a !== undefined) {
          const idIndex = laneIndexAttr.getX(a)
          const laneName = this.laneIdMap[idIndex]
          if (laneName) {
            this.hm.setHighlight('lane', laneName, 'canvas', intersection.point)
            return
          }
        }
      }
      else if (object.name) {
        // Fallback for unmerged objects or if something goes wrong
        this.hm.setHighlight('lane', object.name, 'canvas', intersection.point)
        return
      }
    }

    this.hm.clear('canvas')
  }

  // set OpenDRIVE data
  setOpenDrive(openDrive: OpenDrive) {
    this.openDrive = openDrive
    this.addReferenceLines(openDrive.getReferenceLines())
    this.addRoads(openDrive.getRoads())
  }

  addReferenceLines(referenceLines: ReferenceLine[]): void {
    const material = new LineBasicMaterial({
      color: 0xE68816, // #e68816ff
      opacity: 0.6,
      transparent: true,
    })

    const points: Vector3[] = []
    for (const referenceLine of referenceLines) {
      const linePoints = referenceLine.getPoints().map(p => new Vector3(p.x, p.z, -p.y))
      for (let i = 0; i < linePoints.length - 1; i++) {
        points.push(linePoints[i]!)
        points.push(linePoints[i + 1]!)
      }
    }

    if (points.length > 0) {
      const geometry = new BufferGeometry().setFromPoints(points)
      const line = new LineSegments(geometry, material)
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
    const laneBoundaryMaterial = new LineBasicMaterial({
      color: 0xFFFFFF,
      opacity: 1.0,
      transparent: true,
      blending: NormalBlending,
    })

    const laneGeometries: BufferGeometry[] = []
    const laneBoundaryGeometries: BufferGeometry[] = []
    this.laneIdMap = [] // Reset map

    for (const road of roads) {
      const laneSections = road.getLaneSections()
      for (const section of laneSections) {
        const lanes = section.getLanes()
        for (const lane of lanes) {
          // Lane Area
          const geometry = this.createLaneGeometry(lane)
          if (geometry) {
            const laneId = `${road.id}_${section.s}_${lane.id}`
            this.laneIdMap.push(laneId)
            const index = this.laneIdMap.length - 1

            // Add custom attribute to store index
            const count = geometry.getAttribute('position').count
            const indexArray = new Float32Array(count).fill(index)
            geometry.setAttribute('laneIndex', new BufferAttribute(indexArray, 1))

            laneGeometries.push(geometry)
          }

          // Lane Boundary
          const boundaryGeom = this.createLaneBoundaryGeometry(lane)
          if (boundaryGeom) {
            laneBoundaryGeometries.push(boundaryGeom)
          }
        }
      }
    }

    if (laneGeometries.length > 0) {
      const mergedGeometry = BufferGeometryUtils.mergeGeometries(laneGeometries)
      mergedGeometry.computeBoundsTree()

      const mesh = new Mesh(mergedGeometry, laneAreaMaterial)
      mesh.name = 'merged_road_network'
      this.roadGroup.add(mesh)
    }

    if (laneBoundaryGeometries.length > 0) {
      const mergedLinesGeometry = BufferGeometryUtils.mergeGeometries(laneBoundaryGeometries)
      const lineSegments = new LineSegments(mergedLinesGeometry, laneBoundaryMaterial)
      this.roadmarkGroup.add(lineSegments)
    }

    this.scene.add(this.roadGroup)
    this.scene.add(this.roadmarkGroup)
  }

  public createLaneGeometry(lane: Lane): BufferGeometry | null {
    const boundary = lane.getBoundary()
    const { vertices, indices } = boundaryToArea(boundary)
    if (vertices.length === 0)
      return null

    const positions = new Float32Array(vertices.length)
    for (let i = 0; i < vertices.length / 3; i++) {
      positions[i * 3] = vertices[i * 3]!
      positions[i * 3 + 1] = vertices[i * 3 + 2]!
      positions[i * 3 + 2] = -vertices[i * 3 + 1]!
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    return geometry
  }

  createLaneBoundaryGeometry(lane: Lane): BufferGeometry | null {
    const boundaryLine = lane.getBoundaryLine()
    if (boundaryLine.length < 2) {
      return null
    }

    const segments: Vector3[] = []
    for (let i = 0; i < boundaryLine.length - 1; i++) {
      const p1 = boundaryLine[i]!
      const p2 = boundaryLine[i + 1]!
      segments.push(new Vector3(p1[0], p1[2], -p1[1]))
      segments.push(new Vector3(p2[0], p2[2], -p2[1]))
    }

    if (segments.length === 0)
      return null

    const geometry = new BufferGeometry().setFromPoints(segments)
    return geometry
  }

  private disposeGroup(group: Group) {
    group.traverse((obj: any) => {
      if (obj.geometry) {
        if (obj.geometry.disposeBoundsTree)
          obj.geometry.disposeBoundsTree()
        obj.geometry.dispose()
      }
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
