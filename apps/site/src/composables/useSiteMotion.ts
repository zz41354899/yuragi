import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'

/** Page decoration only: character canvases and editor coordinates remain engine-owned. */
export function useSiteMotion(root: Ref<HTMLElement | undefined>, ready: Ref<boolean>, progress: Ref<HTMLElement | undefined>) {
  const route = useRoute()
  let media: ReturnType<typeof import('gsap').gsap.matchMedia> | undefined
  let runtime: typeof import('gsap').gsap | undefined
  let revision = 0
  let mounted = false

  async function setup() {
    const current = ++revision
    media?.revert()
    media = undefined
    await nextTick()
    const gsap = runtime
    if (!gsap || !mounted || !ready.value || current !== revision || !root.value || route.path === '/playground') return
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    if (!mounted || current !== revision) return
    gsap.registerPlugin(ScrollTrigger)
    const scope = root.value
    media = gsap.matchMedia()
    media.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, context => {
      if (progress.value) gsap.fromTo(progress.value, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: context.conditions?.reduced ? true : .25, invalidateOnRefresh: true },
      })
      // Functional scroll feedback remains immediate when motion is reduced.
      if (context.conditions?.reduced) return
      const cleanups: (() => void)[] = []
      const entrance = scope.querySelectorAll('.stage-hero-copy > *, .docs-page-toolbar, .docs-content > h1, .docs-content > section > .docs-lead')
      if (entrance.length) gsap.from(entrance, { y: 18, opacity: 0, duration: .7, stagger: .09, ease: 'power3.out', clearProps: 'transform,opacity' })

      // Start reveals on entry; offscreen content stays readable and keyboard accessible.
      scope.querySelectorAll<HTMLElement>('.stage-section-copy, .stage-demo-preview, .stage-detail-cards, .stage-code-preview, .stage-cta-copy').forEach(group => {
        // Never hide content that is already onscreen (including restored scroll positions).
        if (group.getBoundingClientRect().top < window.innerHeight) return
        const targets = group.matches('.stage-detail-cards, .stage-section-copy') ? Array.from(group.children) : [group]
        // Apply the start state while offscreen, then reveal as soon as it enters.
        // Delaying the start state until onEnter made visible content disappear first.
        const reveal = gsap.from(targets, { y: 16, opacity: 0, duration: .6, stagger: .07, ease: 'power2.out', paused: true, immediateRender: true, clearProps: 'transform,opacity' })
        ScrollTrigger.create({ trigger: group, start: 'top bottom', once: true, onEnter: () => { reveal.play() } })
        const showFocusedContent = () => { reveal.progress(1) }
        group.addEventListener('focusin', showFocusedContent)
        cleanups.push(() => group.removeEventListener('focusin', showFocusedContent))
      })

      scope.querySelectorAll<HTMLElement>('.stage-workflow li').forEach(step => {
        gsap.fromTo(step.querySelector('.stage-step-number'), { scale: .95 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: step, start: 'top 95%', end: 'top 70%', scrub: .2 } })
      })
      const hero = scope.querySelector('.stage-hero')
      const sparkles = scope.querySelector('.stage-sparkles')
      if (hero && sparkles) gsap.to(sparkles, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .5 } })

      const stars = scope.querySelectorAll('.stage-sparkle')
      if (stars.length) {
        gsap.from(stars, { scale: .2, opacity: 0, duration: .75, stagger: .12, ease: 'back.out(2)', clearProps: 'opacity' })
        gsap.to(stars, { y: -9, rotation: 10, duration: .9, stagger: .13, repeat: 3, yoyo: true, ease: 'sine.inOut', clearProps: 'transform' })
      }
      const art = scope.querySelector('.stage-hero-art img')
      if (art) gsap.from(art, { y: 16, opacity: 0, duration: 1, ease: 'power2.out', clearProps: 'transform,opacity' })

      scope.querySelectorAll<HTMLElement>('.stage-button, .stage-motion-controls button, .stage-framework-tabs button').forEach(button => {
        const feedback = gsap.to(button, { y: -3, scale: 1.035, duration: .32, ease: 'back.out(2.5)', paused: true })
        const enter = () => { if (!button.hasAttribute('disabled')) feedback.play() }
        const leave = () => { feedback.reverse() }
        const release = () => { document.activeElement === button || button.matches(':hover') ? feedback.play() : feedback.reverse() }
        const press = () => { if (!button.hasAttribute('disabled')) feedback.reverse() }
        const events = { pointerenter: enter, pointerleave: leave, focus: enter, blur: leave, pointerdown: press, pointerup: release, pointercancel: leave }
        for (const [name, handler] of Object.entries(events)) {
          button.addEventListener(name, handler)
          cleanups.push(() => button.removeEventListener(name, handler))
        }
      })
      let width = scope.offsetWidth
      let height = scope.offsetHeight
      const refresh = gsap.delayedCall(.15, () => ScrollTrigger.refresh(true)).pause()
      const observer = new ResizeObserver(() => {
        if (scope.offsetWidth === width && scope.offsetHeight === height) return
        width = scope.offsetWidth
        height = scope.offsetHeight
        refresh.restart(true)
      })
      observer.observe(scope)
      cleanups.push(() => { observer.disconnect(); refresh.kill() })
      return () => cleanups.forEach(cleanup => cleanup())
    }, scope)
  }

  onMounted(async () => {
    mounted = true
    runtime = (await import('gsap')).gsap
    if (!mounted) return
    void setup()
  })
  watch(() => `${ready.value}:${route.path}:${String(route.query.section || '')}:${String(route.query.framework || '')}`, () => { if (mounted) void setup() }, { flush: 'post' })
  onBeforeUnmount(() => { mounted = false; ++revision; media?.revert(); media = undefined })
}
