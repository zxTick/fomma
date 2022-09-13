<script setup lang="ts">
import type { FormItem } from 'fomma'
import { ZTForm } from 'fomma'

const options: FormItem[] = [
  {
    label: '账号',
    key: 'username',
    type: 'Textarea',
  },
]
</script>

<template>
  <ZTForm :options="options" />
</template>
