export const isObject = (value) => {
	return typeof value === 'object' && value !== null
}

export const isFunction = (value) => {
	return typeof value === 'function'
}

export const isNumber = (value) => {
	return typeof value === 'number'
}

export const isString = (value) => {
	return typeof value === 'string'
}

export const isArray = Array.isArray

export const assign = Object.assign

export const invokeArrayFns = (fns) => {
	for (let i = 0; i < fns.length; i++) {
		fns[i]()
	}
}

export const hasOwnProperty = Object.prototype.hasOwnProperty

export const hasOwn = (value, key) => hasOwnProperty.call(value, key)

// 组件的类型
export const enum ShapeFlags {
	// 最后要渲染的 element 类型
	ELEMENT = 1,
	FUNCTIONAL_COMPONENT = 1 << 1,
	// 组件类型
	STATEFUL_COMPONENT = 1 << 2,
	// vnode 的 children 为 string 类型
	TEXT_CHILDREN = 1 << 3,
	// vnode 的 children 为数组类型
	ARRAY_CHILDREN = 1 << 4,
	// vnode 的 children 为 slots 类型
	SLOTS_CHILDREN = 1 << 5,
	COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
