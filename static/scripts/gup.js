'use strict';

function gup(name, default_) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, '\\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(window.location.href);
  if (results == null) {
    return default_;
  }
  return results[1];
}
