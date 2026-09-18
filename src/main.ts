/* CVZ-TV. Turn the set on, get pulled into the tube, watch his world go by. */

import './styles/set.css'
import './styles/tube.css'

import { applyStoredFx } from './fx/prefs'
import { armSet } from './tv/set'
import { Broadcast } from './tv/broadcast'

applyStoredFx()

const tv = new Broadcast()
armSet(() => tv.start())
