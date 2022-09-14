import type { FormItemRule, MessageApi } from 'naive-ui'
import type { WatchStopHandle } from 'vue'

type MergeObjects<T> = {
  [K in keyof T]: T[K];
}

type RequiredByKeys<T = Record<string, any>, K = keyof T> = MergeObjects<{
  [P in keyof T as (P extends K ? never : P)]?: T[P];
} & {
  [U in keyof T as (U extends K ? U : never)]-?: T[U];
}>

interface Common {
  /**
   * @description: 表单项的描述
   */
  label: string
  /**
   * @description: 表单项对应的 Object 的 key
   */
  key: string
  /**
   * @description: 表单项的类型
   */
  type: 'Input' | 'InputNum' | 'Select' | 'Checkbox' | 'Radio' | 'Picker' | 'Time' | 'Switch' | 'TreeSelect' | 'Transfer' | 'Null' | 'Textarea'
  /**
   * @description: 表单项的尺寸
   */
  size?: 'small' | 'medium' | 'large' | undefined

  /**
   * @description: NaiveUI 控件的 props
   */
  nativeProps: Record<string, any>

  /**
   * @description: 调用参数获取的方法
  */
  reconfiguration: (value: any) => { key: string; value: any }[]

  /**
   * @description: 控件本身的 update 方法
   */
  update: (row: any) => any

  /**
   * @description: 控件本身的 reset 方法
   */
  reset: (formItem: FormData) => any

  /**
   * @description: 自定义 placeholder
   * @default: 请填写{label}
   */
  customPlaceholder: string

  /**
   * @description: 是否支持 clearable
   * @default: true
   */
  clearable: boolean
}

interface Validate {
  /**
   * @description: 表单项的校验规则类型
   */
  ruleType?:
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'array'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email'
  | 'pattern'
  | 'any'

  /**
   * @description: 寻找验证规则的路径
   */
  path: string

  /**
   * @description: 校验错误的提示文本信息
   * @default: 请填写正确的{label}
   */
  message: string

  /**
   * @description: 触发校验的时机
   * @example: blur, change
   */
  trigger: string

  /**
   * @description: 是否必填
   * @trigger 内部实现的方式
   */
  required: boolean

  /**
   * @description: 是否必填
   * @trigger NaiveUI 实现的方式
   */
  nativeRequired: boolean

  /**
   * @description: 表单校验方法
   * @trigger NaiveUI 实现的方式
   */
  nativeValidator?: (rule: FormItemRule, value: any) => boolean | Error

  /**
   * @description: 表单校验方法
   * @trigger 内部实现的方式
   */
  validator?: (value: FormData, message: MessageApi) => boolean
}

interface Value {

  /**
   * @description: 表单项的值
   */
  defaultValue: unknown

  /**
   * @description: 代理的 key ，用于接收非自身参数
   */
  proxyKey?: string | string[]

  /**
   * @description: 需要监听的 key
   */
  watchKey: string[] | string

  /**
   * @description: watch 的回调
   */
  watchCallBack?: (
    params: FormData[],
    value: string[],
    self: FormData
  ) => Promise<any[]> | void

  /**
   * @description: 若 type 是 Select，可以通过 optionsFetch 获取 options
   */
  optionsFetch: () => Promise<unknown[]>

}

export type FormItem = RequiredByKeys<Common, 'label' | 'key' | 'type'> & Partial<Validate> & Partial<Value>

export interface FormData extends FormItem {
  value: any | null
  options: { label: string; value: string }[]
  _watch?: WatchStopHandle
  _loading: boolean
  _isWatchUpdate: boolean
}
