<script>
  // This simple Svelte counter component stores a reactive `count` value.
  // The `increment` function updates `count`, which automatically re-renders the button text.
  let count = $state(0)
  const increment = () => {
    count += 1
  }
</script>

<button onclick={increment}>
  count is {count}
</button>
