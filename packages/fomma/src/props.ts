import type { PropType, WatchStopHandle } from 'vue'
import type { FormItemRule, FormProps, MessageApi } from 'naive-ui'
const FommaProps = {
  formConfig: {
    type: Object as PropType<FormProps>,
    default: { labelPlacement: 'left' },
  },
  preset: {
    type: String,
    default: 'form-item',
    validator: (value: string) => {
      if (!['form-item', 'grid-item'].includes(value)) {
        console.error(
          'preset value must be `form-item` or `grid-item`, the default value is `form-item`',
        )
        return false
      }
      return true
    },
  },
  options: {
    type: Array as PropType<Array<FormItem>>,
  },
  cols: {
    type: String,
    default: '1 450:2 600:3 900:4',
  },
}

export interface FormItem {
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
  label: string
  key: string
  type: 'Input' | 'InputNum' | 'Select' | 'Checkbox' | 'Radio' | 'Picker' | 'Time' | 'Switch' | 'TreeSelect' | 'Transfer' | 'Null' | 'Textarea'
  size?: 'small' | 'medium' | 'large' | undefined
  cops?: object
  path?: string
  message?: string
  trigger?: string
  required?: boolean
  naive?: boolean
  proxyKey?: string | string[]
  watchKey?: string[] | string
  defaultValue?: any
  axiosOptions?: () => Promise<any[]>
  reconfiguration?: (value: any) => { key: string; value: any }[]
  update?: (row: any) => any
  reset?: (formItem: FormData) => any
  naiveValidator?: (rule: FormItemRule, value: any) => boolean | Error
  validator?: (value: FormData, message: MessageApi) => boolean
  watchCallBack?: (
    params: FormData[],
    value: string[],
    self: FormData
  ) => Promise<any[]> | void
}
export interface FormData extends FormItem {
  value: any | null
  options: { label: string; value: string }[]
  _watch?: WatchStopHandle
  _loading: boolean
  _isWatchUpdate: boolean
}

export type FommaInstanceType = InstanceType<
  typeof import('./index.vue').default
>

export default FommaProps
