<script setup lang="ts">
import type { FormPlusItem } from 'fomma'
import { ZTForm } from 'fomma'

const options: FormPlusItem[] = [
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
