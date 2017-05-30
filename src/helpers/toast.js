import notie from 'notie';

export function toast(message, options = {}) {
  notie.alert({text: message, position: 'bottom', stay: false, time: 5, ...options});
}
