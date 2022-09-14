<script lang="ts" setup>
import type { WatchStopHandle } from 'vue'
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  toRef,
  watch,
} from 'vue'
import {
  NCheckbox,
  NCheckboxGroup,
  NDatePicker,
  NForm,
  NFormItem,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  NTimePicker,
  NTransfer,
  NTreeSelect,
} from 'naive-ui'
import { NOOP, isArray, logError, logWarning } from './utils'
import DataFormPlusProps from './props'
import type { FormData, FormItem } from './props'

// component props
const props = defineProps(DataFormPlusProps)
const options = toRef(props, 'options')

// component state
const data = reactive<{ value: FormData[] }>({
  value: [],
})
const rules = ref<any>({})
const _value = computed(() => {
  return getFormData('role')
})

const setProxyOptions = (proxy: FormData, value: any[]) => {
  proxy.options = value
}
const setProxyDefaultValue = (proxy: FormData) => {
  proxy.value = proxy.defaultValue || null
}

const openComponentLoading = (proxy: FormData) => {
  proxy._loading = true
}
const closeComponentLoading = (proxy: FormData) => {
  proxy._loading = false
}

// RefDom | RefComponent
const dataForm = ref<any>(null)

// stopEffect
const stopWatches: any[] = []

// component var
const axiosOptionsMap = new Map<string, FormData>()
const noOptionsType = ['Input', 'InputNum', 'Picker', 'Time', 'Switch', 'Img']

onMounted(() => {
  if (axiosOptionsMap.size > 0) {
    axiosOptionsMap.forEach(async (value) => {
      const proxy = value
      if (proxy.optionsFetch) {
        const res = await proxy.optionsFetch()
        setProxyOptions(proxy, res)
      }
      if (proxy.defaultValue)
        setProxyDefaultValue(proxy)

      closeComponentLoading(proxy)
      axiosOptionsMap.delete(proxy.key)
    })
  }
})

function initRules() {
  if (data.value) {
    rules.value = []
    data.value.forEach((item) => {
      const message = `${item.label}不可以为空，请输入值。`
      if ((item.path && item.path !== '') || item.nativeRequired) {
        const rule = {
          type: item.ruleType || 'string',
          required: item.nativeRequired || item.required,
          message: item.message || message,
          trigger: item.trigger || 'blur',
          validator: item.nativeValidate,
        }
        if (!rule.validator)
          delete rule.validator

        rules.value[item.path || item.key] = rule
      }
    })
  }
}
function initializeTheCenter() {
  if (!options.value)
    return

  for (const iterator of options.value)
    mixinData(iterator)

  initRules()
  initWatch()
}
initializeTheCenter()

function initWatch() {
  data.value.forEach((item) => {
    if (!item.watchKey || !item.watchCallBack) {
      if (item.watchCallBack || item.watchKey)
        logError('请让watchKey和watchCallBack 一同食用')

      return
    }

    const keyArr = isArray(item.watchKey) ? item.watchKey : [item.watchKey]

    const collectTheKeyFunction: (() => any)[] = []

    const params = keyArr
      .map((key) => {
        const proxy = data.value.find(it => it.key === key)
        if (proxy)
          injectionToMonitorAnArrayElement(proxy)
        else
          logWarning(`你输入的key=${key}不再存在于你传入的表单配置中`)

        return proxy
      })
      .filter(item => !!item) as FormData[]

    if (params.length === 0) {
      logWarning(
        `您在${item.label}---${item.key}中传入${JSON.stringify(
          item.watchKey,
        )}全部无效`,
      )
      return
    }

    function injectionToMonitorAnArrayElement(proxy: FormData) {
      collectTheKeyFunction.push(() => proxy?.value)
    }

    const stopWatch = watch(collectTheKeyFunction, async (newValue) => {
      openComponentLoading(item)
      const res
        = (item.watchCallBack && (await item.watchCallBack(params, newValue, item))) || []
      if (item._isWatchUpdate)
        item.value = null
      else
        item._isWatchUpdate = true

      item.options = res as any[]
      initRules()
      closeComponentLoading(item)
    })
    stopWatches.push(stopWatch)
  })
}
function mixinData(iterator: FormItem) {
  const options: any[] = []
  iterator.size = iterator.size || 'small'
  let _isWatchUpdate = true
  if (iterator.defaultValue)
    _isWatchUpdate = false

  const ProxyLength = data.value.push({
    ...iterator,
    value: null,
    options,
    _loading: true,
    _isWatchUpdate,
  })

  const proxy = data.value[ProxyLength - 1]
  if (iterator.optionsFetch)
    axiosOptionsMap.set(proxy.key, proxy)
}

function getFormData(type = 'create') {
  if (!data.value)
    return
  return data.value.reduce((pre: any, cur: FormData) => {
    if (type === 'create') {
      if (cur.reconfiguration && cur.value !== null) {
        cur.reconfiguration(cur.value).forEach((item) => {
          pre[item.key] = item.value
        })
      }
      else {
        pre[cur.key] = cur.value
      }
    }
    else if (type === 'role') {
      pre[cur.key] = cur.value
    }

    return pre
  }, {})
}

async function update(it: any) {
  Object.keys(it).forEach((key) => {
    const targetProxy = findTargetProxy(key)
    if (!targetProxy)
      return

    if (targetProxy._watch)
      targetProxy._watch()

    const value = targetProxy.update
      ? targetProxy.update(it)
      : it[key]
        ? it[key]
        : null
    const isTargetProxyHas = !noOptionsType.includes(targetProxy.type)

    let stopWatch: WatchStopHandle = NOOP
    if (targetProxy.options.length === 0 && isTargetProxyHas) {
      stopWatch = watch(
        () => targetProxy.options,
        () => {
          targetProxy.value = value
          stopWatch()
        },
        { deep: true },
      )
    }
    else {
      targetProxy.value = value
    }

    targetProxy._watch = stopWatch
  })
}

function findTargetProxy(key: string) {
  const targetProxy = data.value.find((it) => {
    const currentKey = it.proxyKey ? it.proxyKey : it.key
    if (isArray(currentKey))
      return currentKey.includes(key)
    else
      return currentKey === key
  }) as FormData

  return targetProxy
}

/**
 * @description: 重置表单（清空表单）
 */
function reset() {
  if (!data.value)
    return
  data.value.forEach((it: FormData) => {
    if (it.reset)
      it.value = it.reset(it)

    else
      (it.value as any) = null
  })
}

/**
 * @description: 使用naive自带的校验模式
 * @param {Function} callBack 成功后的回调函数
 */
function nativeValidator(callBack: Function) {
  if (dataForm.value) {
    dataForm.value.validate((errors: any) => {
      if (!errors)
        callBack()
    })
  }
}

/**
 * @description: 开启表单验证
 * @return {boolean}
 */
function validator() {
  const messageTools = {
    error: (message: string) => alert(message),
  }
  if (!data.value)
    return
  return data.value.every((it: FormData) => {
    if (it.validate)
      return it.validate(it, messageTools as any)

    if (it.required) {
      if (it.value)
        return true

      messageTools?.error(`${it.label}不能为空`)
      return false
    }
    return true
  })
}

onUnmounted(() => {
  // 取消effect的缓存
  if (stopWatches.length > 0) {
    stopWatches.forEach((stop) => {
      stop()
    })
  }
})

defineExpose({
  getFormData,
  update,
  reset,
  nativeValidator,
  validator,
  _value,
})
</script>

<template>
  <NForm
    v-bind="props.formConfig"
    ref="dataForm"
    :model="_value"
    :rules="rules"
  >
    <!-- 非响应式 -->
    <template v-if="props.preset === 'form-item'">
      <template v-for="item in data.value" :key="item.key">
        <NFormItem
          v-if="item.type !== 'Null'"
          :label="item.label"
          :path="item.path || item.key"
        >
          <template v-if="item.type === 'Input'">
            <NInput
              v-bind="item.nativeProps"
              v-model:value="item.value"
              :size="item.size"
              :placeholder="item.customPlaceholder || `${item.label}不能为空`"
              :clearable="item.clearable || true"
            />
          </template>
          <template v-else-if="item.type === 'Textarea'">
            <NInput
              v-bind="item.nativeProps"
              v-model:value="item.value"
              type="textarea"
              :size="item.size"
              :placeholder="item.customPlaceholder || `${item.label}不能为空`"
              :clearable="item.clearable || true"
            />
          </template>
          <template v-else-if="item.type === 'InputNum'">
            <NInputNumber
              v-bind="item.nativeProps"
              v-model:value="item.value"
              :size="item.size"
              :placeholder="item.customPlaceholder || `${item.label}不能为空`"
              :clearable="item.clearable || true"
            />
          </template>
          <template v-else-if="item.type === 'Select'">
            <NSelect
              v-bind="item.nativeProps"
              v-model:value="item.value"
              :size="item.size"
              :options="item.options"
              :loading="item._loading"
              :placeholder="item.customPlaceholder || `请选择${item.label}`"
              :clearable="item.clearable || true"
            />
          </template>
          <template v-else-if="item.type === 'Checkbox'">
            <NCheckboxGroup
              v-model:value="item.value"
              :size="item.size"
              v-bind="item.nativeProps"
            >
              <NSpace item-style="display: flex;">
                <NCheckbox
                  v-for="ic in item.options"
                  :key="ic.value"
                  :value="ic.value"
                  :label="ic.label"
                />
              </NSpace>
            </NCheckboxGroup>
          </template>
          <template v-else-if="item.type === 'Radio'">
            <NRadioGroup
              v-model:value="item.value"
              :size="item.size"
              v-bind="item.nativeProps"
              name="ic"
            >
              <NSpace>
                <NRadio
                  v-for="song in item.options"
                  :key="song.value"
                  :value="song.value"
                >
                  {{ song.label }}
                </NRadio>
              </NSpace>
            </NRadioGroup>
          </template>
          <template v-else-if="item.type === 'Picker'">
            <NDatePicker
              v-model:value="item.value"
              :size="item.size"
              v-bind="item.nativeProps"
            />
          </template>
          <template v-else-if="item.type === 'Time'">
            <NTimePicker
              v-model:value="item.value"
              :size="item.size"
              v-bind="item.nativeProps"
            />
          </template>
          <template v-else-if="item.type === 'Switch'">
            <NSwitch
              v-model:value="item.value"
              :size="item.size"
              v-bind="item.nativeProps"
            />
          </template>
          <template v-else-if="item.type === 'TreeSelect'">
            <NTreeSelect
              v-model:value="item.value"
              :options="item.options"
              :size="item.size"
              v-bind="item.nativeProps"
              :loading="item._loading"
            />
          </template>
          <template v-else-if="item.type === 'Transfer'">
            <NTransfer
              v-model:value="item.value"
              :size="item.size"
              v-bind="item.nativeProps"
              :options="item.options"
              :loading="item._loading"
            />
          </template>

          <template v-else-if="item.type === 'Null'" />
          <template v-if="item.required">
            <span class="text-red-600 ml-2" style="color:red;margin-left:0.5rem;">*</span>
          </template>
        </NFormItem>
      </template>
    </template>
    <!-- 响应式 -->
    <template v-else-if="props.preset === 'grid-item'">
      <NGrid :cols="props.cols" :x-gap="10">
        <template v-for="item in data.value" :key="item.key">
          <NFormItemGi
            v-if="item.type !== 'Null'"
            :label="item.label"
            :path="item.path || item.key"
          >
            <template v-if="item.type === 'Input'">
              <NInput
                v-bind="item.nativeProps"
                v-model:value="item.value"
                :size="item.size"
                :placeholder="item.customPlaceholder || `${item.label}不能为空`"
                :clearable="item.clearable || true"
              />
            </template>
            <template v-else-if="item.type === 'Textarea'">
              <NInput
                v-bind="item.nativeProps"
                v-model:value="item.value"
                type="textarea"
                :size="item.size"
                :placeholder="item.customPlaceholder || `${item.label}不能为空`"
                :clearable="item.clearable || true"
              />
            </template>
            <template v-else-if="item.type === 'InputNum'">
              <NInputNumber
                v-bind="item.nativeProps"
                v-model:value="item.value"
                :size="item.size"
                :placeholder="item.customPlaceholder || `${item.label}不能为空`"
                :clearable="item.clearable || true"
              />
            </template>
            <template v-else-if="item.type === 'Select'">
              <NSelect
                v-bind="item.nativeProps"
                v-model:value="item.value"
                :size="item.size"
                :options="item.options"
                :loading="item._loading"
                :placeholder="item.customPlaceholder || `请选择${item.label}`"
                :clearable="item.clearable || true"
              />
            </template>
            <template v-else-if="item.type === 'Checkbox'">
              <NCheckboxGroup
                v-model:value="item.value"
                :size="item.size"
                v-bind="item.nativeProps"
              >
                <NSpace item-style="display: flex;">
                  <NCheckbox
                    v-for="ic in item.options"
                    :key="ic.value"
                    :value="ic.value"
                    :label="ic.label"
                  />
                </NSpace>
              </NCheckboxGroup>
            </template>
            <template v-else-if="item.type === 'Radio'">
              <NRadioGroup
                v-model:value="item.value"
                :size="item.size"
                v-bind="item.nativeProps"
                name="ic"
              >
                <NSpace>
                  <NRadio
                    v-for="song in item.options"
                    :key="song.value"
                    :value="song.value"
                  >
                    {{ song.label }}
                  </NRadio>
                </NSpace>
              </NRadioGroup>
            </template>
            <template v-else-if="item.type === 'Picker'">
              <NDatePicker
                v-model:value="item.value"
                :size="item.size"
                v-bind="item.nativeProps"
              />
            </template>
            <template v-else-if="item.type === 'Time'">
              <NTimePicker
                v-model:value="item.value"
                :size="item.size"
                v-bind="item.nativeProps"
              />
            </template>
            <template v-else-if="item.type === 'Switch'">
              <NSwitch
                v-model:value="item.value"
                :size="item.size"
                v-bind="item.nativeProps"
              />
            </template>
            <template v-else-if="item.type === 'TreeSelect'">
              <NTreeSelect
                v-model:value="item.value"
                :options="item.options"
                :size="item.size"
                v-bind="item.nativeProps"
              />
            </template>
            <template v-else-if="item.type === 'Transfer'">
              <NTransfer
                v-model:value="item.value"
                :size="item.size"
                v-bind="item.nativeProps"
                :options="item.options"
              />
            </template>
            <template v-else-if="item.type === 'Null'" />
            <template v-if="item.required">
              <span class="text-red-600 ml-2" style="color:red;margin-left:0.5rem;">*</span>
            </template>
          </NFormItemGi>
        </template>
      </NGrid>
    </template>
  </NForm>
</template>

<style lang="scss" scoped></style>
