const EVENT_LABEL = {
  authorized_user: "Manish Authorized",
  unauthorized_face: "Unauthorized Person Detected",
  no_face_detected: "No User Detected",
  screen_locked: "System Locked",
  screen_off: "Screen Off",
}

export default function ActivityTable({ items = [] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>TIME (UTC)</th>
            <th>EVENT</th>
            <th>CONF.</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const event = it.type || it.event
            const conf =
              it.confidence === null || it.confidence === undefined
                ? ""
                : Number(it.confidence).toFixed(2)

            return (
              <tr key={it._id || crypto.randomUUID()}>
                <td>{it.ts}</td>
                <td>{EVENT_LABEL[event] || event}</td>
                <td>{conf}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

