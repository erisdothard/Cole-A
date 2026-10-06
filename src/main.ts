/* CVZ-TV. Turn the set on, pick a tape, get pulled into the tube, watch his world go by. */

import './styles/set.css'
import './styles/tube.css'
import './styles/shelf.css'

import { applyStoredFx } from './fx/prefs'
import { armSet } from './tv/set'
import { Shelf } from './tv/shelf'
import { Broadcast } from './tv/broadcast'

applyStoredFx()

const shelf = new Shelf()
const tv = new Broadcast(shelf)
const stage = armSet(shelf, (t) => tv.start(t), (t) => tv.prepare(t))
tv.onEject = (t) => stage.pullOut(t)
