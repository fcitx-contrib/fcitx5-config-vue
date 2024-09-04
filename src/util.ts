import { computed } from 'vue'
import { useBreakpoint } from 'vooks'

const breakpoint = useBreakpoint()
export const isMobile = computed(() => breakpoint.value === 'xs' || breakpoint.value === 's')
