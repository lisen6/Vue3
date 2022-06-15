export let activeEffect = undefined;

function cleanUpEffect(effect) {
  const { deps } = effect; // 这个deps里面对应的是name对应的effect
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect); // 解除effect， 重新收集依赖
  }
  effect.deps.length = 0;
}

class ReactiveEffect {
  public parent = null;
  public deps = []; // 记录当前effect被哪些属性收集了
  public active = true; // effect默认是激活状态
  constructor(public fn) {}
  run() {
    // run 执行effect
    if (!this.active) {
      // 非激活状态下，只需要执行函数，不需要进行依赖收集
      return this.fn();
    }

    try {
      this.parent = activeEffect; // 处理effect嵌套的情况

      // 需要在执行用户函数之前，将之前收集的内容清空
      cleanUpEffect(this);

      // 这里就要依赖收集， 核心就是将当前的effect和稍后渲染的属性关联在一起
      activeEffect = this;
      return this.fn(); // 当稍后调用取值操作的时候，就可以获取到这个全局的activeEffect
    } finally {
      activeEffect = this.parent;
      //   this.parent = null;
    }
  }
}

export function effect(fn) {
  // fn可以根据状态变化重新执行

  const _effect = new ReactiveEffect(fn); // 创建响应式的effect

  _effect.run(); // 默认先执行一次
}

// 一个effect对应多个属性，一个属性对应多个effect
// 结论：多对多
const targetMap = new WeakMap();
export function track(target, type, key) {
  // 只有在effect里才做收集
  if (!activeEffect) return;

  // weakMap = {对象：Map{key, Set}}  key代表当前属性，Set代表当前收集到的effect
  /**
        const state = reactive({ name: 'lisen', age: 18})
   *    effect(() => {
            app.innerHTML = state.name + state.age
        })
        对象就是这个源对象{name: 'lisen', age: 18}
        key是name跟age
        Set放入的就是这个effect(activeEffect)
        name跟age属性跟当前effect函数做关联
   */
  let depsMap = targetMap.get(target); // 第一次没有
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  let shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep); // 让effect记录对应的dep（Set数据结构）， 稍后清理的时候会用到
  }
}

export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return; // 触发的key不在模板中

  let effects = depsMap.get(key); // 找到属性对应的effect

  if (effects) {
    effects = new Set(effects);
    effects.forEach((effect) => {
      // 我们在执行effect的时候，又要执行自己，那我们需要屏蔽掉，不要无限调用
      if (effect !== activeEffect) {
        effect.run();
      }
    });
  }
}
