import {editorEnhanced} from './components/editorEnhanced';
import {enhancePage} from './enhancer';
import {is} from './is';

enhancePage({'editor': element => editorEnhanced(is(HTMLElement, element)),});
