<script setup lang="ts">
import { ref } from "vue";
import Clip from "./components/Clip.vue";

const selectedFile = ref<File>();
const change = (e: Event) => {
  const el = e.target as HTMLInputElement;
  const file = (el.files || [])[0];
  selectedFile.value = file;
  el.value = "";
};
</script>

<template>
  <div>
    <Clip :file="selectedFile" />
    <input ref="input" type="file" @change="change" />
  </div>
</template>

<style scoped></style>
