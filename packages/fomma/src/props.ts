import type { PropType } from 'vue'
import type { FormProps } from 'naive-ui'
import type { FormItem } from './options'

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

export type FommaInstanceType = InstanceType<
  typeof import('./index.vue').default
>

export default FommaProps
export * from './options'
