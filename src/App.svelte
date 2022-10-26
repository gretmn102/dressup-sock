<script lang="ts">
	import { onMount } from "svelte"
  import Icon from "svelte-awesome"
  import { eye } from "svelte-awesome/icons"
  import { Option, Pair, Choice, Result } from "@fering-org/functional-helper"

  import { type Deferrer, Page, LayersPositionPage, CategoriesPage } from "./common"
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

  let page: Page = Page.mkCategoriesEmpty()

  function changeLayersPositionHandler(index: number) {
    if (page[0] === "LayersPosition") {
      if (container && myDoc && myDoc[0] === "Ok") {
        Pair.reduce(
          LayersPositionPage.changeLayerPosition(
            page[1],
            myDoc[1],
            container.firstChild as SVGElement,
            index
          ),
          (layersPositionPage, root) => {
            page = Page.mkLayersPosition(layersPositionPage)
            if (root) {
              myDoc = Result.mkOk<Document.Root, string>(root)
            }
          }
        )
      }
    }
  }

  function changeCatalogPositionHandler(pos: Document.LayersCatalog.Pos) {
    if (page[0] === "Categories") {
      if (container && myDoc && myDoc[0] === "Ok") {
        Pair.reduce(
          CategoriesPage.changePosition(
            page[1],
            myDoc[1],
            pos
          ),
          (categoriesPage, root) => {
            page = Page.mkCategories(categoriesPage)
            if (root) {
              myDoc = Result.mkOk<Document.Root, string>(root)
            }
          }
        )
      }
    }
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
              <div>
                <button
                  disabled={page[0] === "Categories"}
                  on:click={() => {
                    if (page[0] !== "Categories") {
                      page = Page.mkCategoriesEmpty()
                    }
                  }}
                >
                  Categories
                </button>
                <button
                  disabled={page[0] === "LayersPosition"}
                  on:click={() => {
                    if (page[0] !== "LayersPosition") {
                      page = Page.mkLayersPositionEmpty()
                    }
                  }}
                >
                  LayersPosition
                </button>
              </div>
              <div class="buttons">
                {#if page[0] === "Categories"}
                  {#each myDoc[1].layersCatalog as layer, firstIndex}
                    {#if layer[0] === "Category"}
                      <div class="row">
                        <div class="category__header">
                          <button
                            on:click={_ => {
                              changeCatalogPositionHandler(Document.LayersCatalog.Pos.mkCategory(firstIndex))
                            }}
                            style={CategoriesPage.isSelected(page[1], Document.LayersCatalog.Pos.mkCategory(firstIndex)) ? "color: red;" : ""}
                          >
                          {Document.Category.getName(layer[1], myDoc[1])}
                          </button>
                        </div>
                        <div class="category__body">
                          {#each layer[1].elements as element, elementIndex}
                            <div>
                              <button
                                on:click={_ => {
                                  changeCatalogPositionHandler(Document.LayersCatalog.Pos.mkCategoryElement(firstIndex, elementIndex))
                                }}
                                style={CategoriesPage.isSelected(page[1], Document.LayersCatalog.Pos.mkCategoryElement(firstIndex, elementIndex)) ? "color: red;" : ""}
                              >
                                {Document.LayerContainer.getName(element, myDoc[1])}
                              </button>
                              <button
                                on:click={_ => {
                                  layerToggleVisibleHandle(Document.LayersCatalog.Pos.mkCategoryElement(firstIndex, elementIndex))
                                }}
                                style={Document.LayerContainer.isHidden(element, myDoc[1]) ? "" : "color: red;"}
                              >
                                <Icon data={eye} />
                              </button>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {:else if layer[0] === "Element"}
                      <div class="row">
                        <button
                          on:click={_ => {
                            changeCatalogPositionHandler(Document.LayersCatalog.Pos.mkElement(firstIndex))
                          }}
                          style={CategoriesPage.isSelected(page[1], Document.LayersCatalog.Pos.mkElement(firstIndex)) ? "color: red;" : ""}
                        >
                          {Document.LayerContainer.getName(layer[1], myDoc[1])}
                        </button>
                        <button
                          on:click={_ => {
                            layerToggleVisibleHandle(Document.LayersCatalog.Pos.mkElement(firstIndex))
                          }}
                          style={Document.LayerContainer.isHidden(layer[1], myDoc[1]) ? "" : "color: red;"}
                        >
                          <Icon data={eye} />
                        </button>
                      </div>
                    {/if}
                  {/each}
                {:else if page[0] === "LayersPosition"}
                  {#each myDoc[1].layersPosition as layer, index}
                    <div class="row">
                      <button
                        on:click={_ => void changeLayersPositionHandler(index)}
                        style={LayersPositionPage.isSelected(page[1], index) ? "color: red;" : ""}
                      >
                        {index} {myDoc[1].layers.get(layer)?.name}
                      </button>
                    </div>
                  {/each}
                {/if}
              </div>
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
    display: flex;
    flex-direction: column;
  }

  .buttons {
    overflow-y: auto;
    overflow-x: auto;
  }

  .row {
    width: max-content;
  }

  .category__header {

  }

  .category__body {
    margin-left: 10px;
  }
</style>
