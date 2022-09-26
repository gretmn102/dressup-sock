<script lang="ts">
	import { onMount } from "svelte"

  import type { Deferrer, Result } from "./common"
  import * as LayerList from "./layerList"
  import type * as UniversalParser from "./universalParser"

  let sockFetchResponse: Deferrer<Result<SVGElement, Error>> = ["HasNotStartedYet"] // @hmr:keep

  let layers: UniversalParser.Result<LayerList.Layer[]> | undefined

  function getLayers(): UniversalParser.Result<LayerList.Layer[]> | undefined {
    if (sockFetchResponse[0] === "Resolved" && sockFetchResponse[1][0] === "Ok") {
      const svg = sockFetchResponse[1][1]

      const layers: SVGGElement[] = Array()
      for (const g of svg.getElementsByTagName("g")) {
        if (g.hasAttribute("id")) {
          layers.push(g)
        }
      }

      return LayerList.getLayers(layers.reverse())
    }
  }

  function layerToggleVisibleHandle(pos: LayerList.LayerList.Pos) {
    if (layers) {
      if (layers[0] === "Success") {
        LayerList.LayerList.toggleVisible(layers[1][1], pos)
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
                container.replaceChildren(svg)

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
            {#if layers[0] === "Success"}
              {#each layers[1][1] as layer, firstIndex}
                {#if layer[0] === "Category"}
                  <div>
                    <div>{layer[1].content.name}</div>
                    {#each layer[1].elements as element, elementIndex}
                      <div>
                        <button
                          on:click={_ => {
                            layerToggleVisibleHandle(LayerList.LayerList.Pos.mkCategory(firstIndex, elementIndex))
                          }}
                        >
                          {element.content.name}
                        </button>
                      </div>
                    {/each}
                  </div>
                {:else if layer[0] === "Element"}
                  <div>
                    <button
                      on:click={_ => {
                        layerToggleVisibleHandle(LayerList.LayerList.Pos.mkElement(firstIndex))
                      }}
                    >
                      {layer[1].content.name}
                    </button>
                  </div>
                {/if}
              {/each}
            {:else}
              <pre style="color: red">{JSON.stringify(layers, undefined, 2)}</pre>
              <button on:click={fetchSock}>Try again</button>
            {/if}
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
