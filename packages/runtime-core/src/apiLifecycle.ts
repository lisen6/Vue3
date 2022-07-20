import { currentInstance, setCurrentInstance } from './component'

export const enum LifecycleHooks {
	BEFORE_MOUNT = 'bm',
	MOUNTED = 'm',
	BEFORE_UPDATE = 'bu',
	UPDATED = 'u',
}

function createHook(type) {
	return (hook, target = currentInstance) => {
		// hook要绑定到对应的实例上，我们之前写的依赖收集
		if (target) {
			// 关联此currentInstance和hook
			const hooks = target[type] || (target[type] = [])

			const wrappedHook = () => {
				setCurrentInstance(target)
				hook() // 将当前实例保存到currentInstance上
				setCurrentInstance(null)
			}
			hooks.push(wrappedHook)
		}
	}
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)

export const onMounted = createHook(LifecycleHooks.MOUNTED)

export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)

export const onUpdated = createHook(LifecycleHooks.UPDATED)
