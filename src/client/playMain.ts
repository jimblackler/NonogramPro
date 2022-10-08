import {playControlEnhanced} from './components/playControlEnhanced';
import {enhancePage} from './enhancer';
import {is} from './is';

enhancePage({'playControl': element => playControlEnhanced(is(element, HTMLElement))});
