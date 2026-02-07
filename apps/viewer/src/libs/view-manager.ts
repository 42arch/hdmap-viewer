import type Viewer from './viewer'
import { AxesHelper, Box3, GridHelper, Group, MathUtils, Vector3 } from 'three'
import { ThreePerf } from 'three-perf'

class ViewManager {
  private viewer: Viewer
  private helperGroup: Group
  private pref: ThreePerf

  constructor(viewer: Viewer) {
    this.viewer = viewer

    this.helperGroup = new Group()
    this.helperGroup.name = 'helpers'

    this.pref = new ThreePerf({
      domElement: document.body,
      renderer: this.viewer.renderer,
      anchorX: 'left',
      anchorY: 'bottom',
    })
    this.pref.visible = false
  }

  calculateBoundingBox() {
    const box = new Box3()
    this.viewer.roadGroup.traverse((obj) => {
      obj.updateWorldMatrix(true, false)

      if ((obj as any).geometry) {
        (obj as any).geometry.computeBoundingBox()
        box.union((obj as any).geometry.boundingBox!)
      }
    })
    return box
  }

  addHelper(size: Vector3, center: Vector3): void {
    const cellSize = 10
    const baseSize = Math.max(size.x, size.z)
    const divisions = Math.ceil(baseSize / cellSize)
    const gridSize = divisions * cellSize

    const axesHelper = new AxesHelper(10)
    axesHelper.position.set(center.x, center.y, center.z)
    axesHelper.translateY(-0.01)
    axesHelper.material.depthTest = true
    axesHelper.material.depthWrite = false
    axesHelper.renderOrder = -1

    const gridHelper = new GridHelper(gridSize + 10, divisions, 0x6D6D6D, 0x6D6D6D) // #6d6d6dff

    gridHelper.position.set(center.x, center.y, center.z)
    gridHelper.material.depthTest = true
    gridHelper.material.depthWrite = false
    gridHelper.renderOrder = -2
    gridHelper.translateY(-0.02)
    this.helperGroup.add(gridHelper)
    this.helperGroup.add(axesHelper)
    this.viewer.scene.add(this.helperGroup)
  }

  toggleReferenceLines(visible: boolean) {
    this.viewer.referenceLineGroup.visible = visible
  }

  toggleRoads(visible: boolean) {
    this.viewer.roadGroup.visible = visible
  }

  toggleRoadmarks(visible: boolean) {
    this.viewer.roadmarkGroup.visible = visible
  }

  toggleHelper(visible: boolean) {
    this.helperGroup.visible = visible
  }

  togglePerfMonitor(visible: boolean) {
    this.pref.visible = visible
  }

  begin() {
    this.pref.begin()
  }

  end() {
    this.pref.end()
  }

  fitToCamera() {
    const box = this.calculateBoundingBox()
    this.fitToBox(box)
  }

  fitToBox(box: Box3) {
    if (box.isEmpty())
      return

    const camera = this.viewer.camera
    const controls = this.viewer.controls

    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const offset = 1.2

    const maxSize = Math.max(size.x, size.y, size.z)
    const fov = MathUtils.degToRad(camera.fov)
    const distance = (maxSize / 2) / Math.tan(fov / 2) * offset

    const currentPos = camera.position.clone()
    const currentTarget = controls?.target.clone() ?? new Vector3()
    const direction = currentPos.sub(currentTarget).normalize()

    camera.position.copy(direction.multiplyScalar(distance).add(center))

    camera.near = distance / 100
    camera.far = distance * 100
    camera.updateProjectionMatrix()

    if (controls) {
      controls.target.copy(center)
      controls.update()
    }

    // Update helpers if needed, but maybe not for specific zoom
    // this.addHelper(size, center)
  }

  clear() {
    this.helperGroup.clear()
    this.viewer.scene.remove(this.helperGroup)
  }
}

export default ViewManager
