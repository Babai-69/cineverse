export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { bg:'var(--bg)', surface:'var(--surface)', surface2:'var(--surface-2)', accent:'var(--accent)', accent2:'var(--accent-2)', muted:'var(--muted)' },
    fontFamily: { display:['"Bebas Neue"','sans-serif'], sans:['Inter','sans-serif'], mono:['"JetBrains Mono"','monospace'] }
  } }, plugins: []
}
