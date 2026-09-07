import { retryFailedMoyskladOrders } from "../lib/moysklad/order-retry"
import { preparePayloadRuntime } from "./payload-runtime"
import { parseArgs } from "node:util"

async function main() {
  const { values } = parseArgs({ options: {
    ids: { type: "string" }, force: { type: "boolean", default: false }, help: { type: "boolean" },
  } })
  if (values.help) {
    console.log("Use --ids 343,202,217 to select orders; --force also refreshes unchanged selected documents. Omitting --ids runs the normal full retry. Owner-approved legacy exclusions remain skipped, including with --force.")
    return
  }
  const tokens = values.ids?.split(",")
  if (tokens && (!tokens.length || tokens.some(id => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))))) throw new Error("Некорректный список ID заказов")
  if (values.force && !tokens) throw new Error("--force требует явного списка --ids")
  preparePayloadRuntime()
  const [{ getPayload }, configModule] = await Promise.all([
    import("payload"),
    import("../payload.config"),
  ])
  const payload = await getPayload({ config: configModule.default })
  const result = await retryFailedMoyskladOrders(payload, { includeAllUnexported: true, includeExisting: true, minAgeMs: 0,
    orderIds: tokens?.map(Number), forceSelected: values.force })
  console.log(JSON.stringify(result, null, 2))
  if (result.failed > 0) process.exitCode = 1
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit(process.exitCode || 0)
  })
