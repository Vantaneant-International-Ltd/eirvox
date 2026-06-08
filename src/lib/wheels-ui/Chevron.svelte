<script lang="ts">
  export let dir: 'right' | 'left' | 'up' | 'down' = 'right';
  export let size = 13;
  export let color = 'currentColor';
  export let stroke = 2;

  const paths: Record<string, string> = {
    right: 'M1 1l6 6-6 6',
    left:  'M7 1L1 7l6 6',
    down:  'M1 1l6 6 6-6',
    up:    'M1 7l6-6 6 6',
  };
  $: viewBox = dir === 'down' || dir === 'up' ? '0 0 14 8' : '0 0 8 14';
  $: width = dir === 'down' || dir === 'up' ? Math.round(size * 1.6) : size;
</script>

<svg {width} height={size} {viewBox} fill="none" style="flex-shrink: 0;">
  <path d={paths[dir]} {stroke} stroke-width={stroke} stroke-linecap="round" stroke-linejoin="round" stroke-rendering="geometricPrecision" style="stroke: {color};" />
</svg>
