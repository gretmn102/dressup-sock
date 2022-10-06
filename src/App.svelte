<script lang="ts">
	import { onMount } from "svelte"

  import { type Deferrer, Result } from "./common"
  import * as Document from "./document"
  import * as SvgImporter from "./SvgImporter"

  import UploadSock from "./UploadSock.svelte"

  let sockFetchResponse: Deferrer<Result<SVGElement, Error>> = ["HasNotStartedYet"] // @hmr:keep

  let myDoc: Result<Document.Root, string> | undefined

  function getLayers(): Result<Document.Root, string> | undefined {
    if (sockFetchResponse[0] === "Resolved" && sockFetchResponse[1][0] === "Ok") {
      const svg = sockFetchResponse[1][1]
      return SvgImporter.importSvg(svg as unknown as Document)
    }
  }

  function layerToggleVisibleHandle(pos: Document.LayersCatalog.Pos) {
    if (myDoc) {
      if (myDoc[0] === "Ok") {
        const root = myDoc[1]
        const res = Document.LayersCatalog.toggleVisible(root.layersCatalog, root, pos)
        if (res) {
          myDoc = Result.mkOk<Document.Root, string>(res)
        }
      }
    }
  }

  let container: HTMLDivElement | undefined

  function loadSvg(rawSvg: string) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(rawSvg, "image/svg+xml")
    const svg = doc.documentElement as unknown as SVGElement

    svg.setAttribute("style", "width: 100%; height: 100%")

    sockFetchResponse = ["Resolved", ["Ok", svg]]

    myDoc = getLayers()

    // Wait to initialize the container
    let timer = setInterval(() => {
      if (container) {
        container.replaceChildren(svg)

        clearInterval(timer)
      }
    })
  }

  const fetchSock = () => {
    sockFetchResponse = ["InProgress"]

    fetch("./sock.svg")
      .then(res => {
        res.text()
          .then(rawSvg => {
            loadSvg(rawSvg)
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
  <div class="upload_sock">
    <UploadSock
      startLoading={() => { sockFetchResponse = ["InProgress"] }}
      cb={rawSvg => { loadSvg(rawSvg) }}
    />
  </div>
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

        {#if myDoc}
          <div class="container__buttons">
            {#if myDoc[0] === "Ok"}
              {#each myDoc[1].layersCatalog as layer, firstIndex}
                {#if layer[0] === "Category"}
                  <div>
                    <div>{Document.Category.getName(layer[1], myDoc[1])}</div>
                    {#each layer[1].elements as element, elementIndex}
                      <div>
                        <button
                          on:click={_ => {
                            layerToggleVisibleHandle(Document.LayersCatalog.Pos.mkCategory(firstIndex, elementIndex))
                          }}
                          style={Document.LayerContainer.isHidden(element, myDoc[1]) ? "" : "color: red;"}
                        >
                          {Document.LayerContainer.getName(element, myDoc[1])}
                        </button>
                      </div>
                    {/each}
                  </div>
                {:else if layer[0] === "Element"}
                  <div>
                    <button
                      on:click={_ => {
                        layerToggleVisibleHandle(Document.LayersCatalog.Pos.mkElement(firstIndex))
                      }}
                      style={Document.LayerContainer.isHidden(layer[1], myDoc[1]) ? "" : "color: red;"}
                    >
                      {Document.LayerContainer.getName(layer[1], myDoc[1])}
                    </button>
                  </div>
                {/if}
              {/each}
            {:else}
              <pre style="color: red">{JSON.stringify(myDoc, undefined, 2)}</pre>
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

  .upload_sock {
    position: relative;
  }

  .container__character {
    display: flex;
    align-items: center;
  }

  .container__buttons {
    overflow-y: auto;
  }
</style>
