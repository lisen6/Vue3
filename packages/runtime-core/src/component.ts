import { isObject, ShapeFlags } from '@vue/shared'
import { proxyRefs, reactive } from '@vue/reactivity'
import { hasOwn, isFunction } from '@vue/shared'
import { initProps } from './componentProps'
export let currentInstance = null
export const setCurrentInstance = (instance) => {
	currentInstance = instance
}
export const getCurrentInstance = () => currentInstance

export function createComponentInstance(vnode) {
	// 组件的实例
	const instance = {
		data: null,
		vnode,
		subTree: null, // 渲染的组件内容
		isMounted: false,
		update: null,
		propsOptions: vnode.type.props,
		props: {},
		attrs: {},
		proxy: null,
		render: null,
		setupState: {},
		slots: {}, // 插槽相关
	}

	console.log(instance)
	return instance
}

const publicPropertyMap = {
	$attrs: (i) => i.attrs,
	$slots: (i) => i.slots,
}

const publicInstanceProxy = {
	get(target, key) {
		const { data, props, setupState } = target
		if (data && hasOwn(data, key)) {
			return data[key]
		} else if (hasOwn(setupState, key)) {
			return setupState[key]
		} else if (props && hasOwn(props, key)) {
			return props[key]
		}
		let getter = publicPropertyMap[key]
		if (getter) {
			return getter(target)
		}
	},
	set(target, key, value) {
		const { data, props, setupState } = target
		if (data && hasOwn(data, key)) {
			data[key] = value
			return true
		} else if (hasOwn(setupState, key)) {
			setupState[key] = value
		} else if (props && hasOwn(props, key)) {
			console.warn('attempting to mutate prop' + (key as string))
			return false
		}
		return true
	},
}

function initSlots(instance, children) {
	if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
		instance.slots = children // 保存插槽
	}
}

export function setupComponent(instance) {
	let { props, type, children } = instance.vnode

	initProps(instance, props)

	// 初始化插槽
	initSlots(instance, children)

	instance.proxy = new Proxy(instance, publicInstanceProxy)

	let data = type.data
	if (data) {
		if (!isFunction(data)) {
			return console.warn('data option must be a function')
		}
		instance.data = reactive(data.call(instance.proxy))
	}

	let setup = type.setup
	if (setup) {
		const setupContext = {
			emit: (event, ...args) => {
				// 事件的实现原理
				const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
				// 找到虚拟节点的props。里面存放了事件
				const handler = instance.vnode.props[eventName]
				handler && handler(...args)
			},
			attrs: instance.attrs,
			slots: instance.slots,
		}
		setCurrentInstance(instance)
		const setupResult = setup(instance.props, setupContext)
		setCurrentInstance(null)
		if (isFunction(setupResult)) {
			instance.render = setupResult
		} else if (isObject(setupResult)) {
			// 对内部的ref取消.value取值
			instance.setupState = proxyRefs(setupResult)
		}
	}

	if (!instance.render) {
		instance.render = type.render
	}
}
