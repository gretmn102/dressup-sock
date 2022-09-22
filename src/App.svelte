<script lang="ts">
	import { onMount } from "svelte"

  import type { Deferrer, Result } from "./common"

  type Layer = {
    svgElement: SVGGElement
  }

  function layerIsHidden(layer: Layer) {
    const visibility = layer.svgElement.getAttribute("visibility")
    if (visibility && visibility === "hidden") {
      return true
    }

    return false
  }

  function layerToggleVisible(layer: Layer) {
    if (layerIsHidden(layer)) {
      layer.svgElement.setAttribute("visibility", "")
    } else {
      layer.svgElement.setAttribute("visibility", "hidden")
    }
  }

  let sockFetchResponse: Deferrer<Result<SVGElement, Error>> = ["HasNotStartedYet"] // @hmr:keep

  let layers: Layer[] | undefined

  function getLayers(): Layer [] | undefined {
    if (sockFetchResponse[0] === "Resolved" && sockFetchResponse[1][0] === "Ok") {
      const svg = sockFetchResponse[1][1]

      let layers: Layer[] = Array()
      for (const g of svg.getElementsByTagName("g")) {
        if (g.hasAttribute("id")) {
          layers.push({
            svgElement: g
          })
        }
      }

      return layers
    }
  }

  function layerToggleVisibleHandle(idx: number) {
    if (layers) {
      const layer = layers[idx]
      if (layer) {
        layerToggleVisible(layer)
      }
    }
  }

  let container: HTMLDivElement | undefined

  const fetchSock = () => {
    fetch("./sock.svg")
      .then(res => {
        res.text()
          .then(rawSvg => {
            const parser = new DOMParser()
            const doc = parser.parseFromString(rawSvg, "image/svg+xml")
            const svg = doc.documentElement as unknown as SVGElement

            svg.setAttribute("style", "width: 100%; height: 100%")

            sockFetchResponse = ["Resolved", ["Ok", svg]]

            layers = getLayers()

            // Wait to initialize the container
            let timer = setInterval(() => {
              if (container) {
                container.appendChild(svg)

                clearInterval(timer)
              }
            })
          })
          .catch(err => {
            sockFetchResponse = ["Resolved", ["Error", err]]
          })
      })
      .catch(err => {
        sockFetchResponse = ["Resolved", ["Error", err]]
      })
  }

	onMount(() => {
    fetchSock()
	})
</script>

<main>
  {#if sockFetchResponse[0] === "HasNotStartedYet"}
    <button on:click={fetchSock}>Load</button>
  {:else if sockFetchResponse[0] === "InProgress"}
    <div>...</div>
  {:else if sockFetchResponse[0] === "Resolved"}
    {#if sockFetchResponse[1][0] === "Error"}
      <pre style="color: red">{sockFetchResponse[1][1]}</pre>
      <button on:click={fetchSock}>Try again</button>
    {:else}
      <div class="container">
        <div class="container__character" bind:this={container} />

        {#if layers}
          <div class="container__buttons">
            {#each layers as layer, idx}
              <div>
                <button
                  on:click={_ => {
                    layerToggleVisibleHandle(idx)
                  }}
                >
                  {layer.svgElement.id}
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</main>

<style>
  main {
    display: flex;
    justify-content: center;

    height: 100vh;
  }

  .container {
    display: flex;

    max-height: 100vh;
  }

  .container__character {
    display: flex;
    align-items: center;
  }

  .container__buttons {
    overflow-y: auto;
  }
</style>
