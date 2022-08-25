const map = new Map();
window.EventLoop = {
  // put: function(e){
  //
  // }
};
EventLoop.put = function (e) {
  const key = JSON.stringify({type: e.type, x: e.x, y: e.y, timeStamp: e.timeStamp});
  map.set(key, e);
  return key;
}
EventLoop.get = function (str) {
  return map.get(str);
}