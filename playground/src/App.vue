<script setup lang="ts">
import type { FormPlusItem } from 'ztform'
import { ZTForm } from 'ztform'

const options: FormPlusItem[] = [
  {
    label: '账号',
    key: 'username',
    type: 'Input',
  },
]
</script>

<template>
  <ZTForm :options="options" />
</template>
