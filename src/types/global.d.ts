export enum PatrolEvent {
	EVENT1 = '拍照',
	EVENT2 = '转圈',
	EVENT3 = '自定义事件1',
	EVENT4 = '自定义事件2',
}

type Quaternion = {
  w: number
  x: number
  y: number
  z: number
}

type NavTranslation = {
  x: number
  y: number
  z: number
} | null

type NavRotation = {
  x: number
  y: number
  z: number
  w: number
} | null

type Pose = {
  position: NavTranslation
  orientation: NavRotation
}

type PatrolPoint = {
  label_name: string;
  pose: Pose;
  event?: Array<PatrolEvent>;
}