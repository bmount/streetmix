var main = (function(){
  var main = {};

  var WIDTH_MULTIPLIER = 12; // 12 pixels per foot
  var WIDTH_TOOL_MULTIPLIER = 4; // 12 pixels per foot

  var SEGMENT_TYPES = {
    "sidewalk": {
      name: 'Sidewalk',
      defaultWidth: 6,
      color: 'rgba(210, 210, 210, 1)',
      texture: "texture_sidewalk_pattern"
    },
    "sidewalk-tree": {
      name: 'Sidewalk w/ a tree',
      defaultWidth: 6,
      color: 'rgba(240, 240, 210, .9)',
      texture: "texture_sidewalk_pattern"
    },
    "planting-strip": {
      name: 'Planting strip',
      defaultWidth: 4,
      color: 'rgba(70, 140, 70, .8)',
      texture: "texture_grass_pattern"
    },
    "bike-lane-inbound": {
      name: 'Bike lane',
      subname: 'Inbound',
      defaultWidth: 6,
      color: 'rgba(75, 71, 72, .9)',
      texture: "texture_asphalt_pattern"
    },
    "bike-lane-outbound": {
      name: 'Bike lane',
      subname: 'Outbound',
      defaultWidth: 6,
      color: 'rgba(75, 71, 72, .9)',
      texture: "texture_asphalt_pattern"
    },
    "parking-lane": {
      name: 'Parking lane',
      defaultWidth: 8,
      color: 'rgba(75, 71, 72, .9)',
      texture: "texture_asphalt_pattern"
    },
    "drive-lane-inbound": {
      name: 'Drive lane',
      subname: 'Inbound',
      defaultWidth: 10,
      color: 'rgba(75, 71, 72, .9)',
      texture: "texture_asphalt_pattern"
    },
    "drive-lane-outbound": {
      name: 'Drive lane',
      subname: 'Outbound',
      defaultWidth: 10,
      color: 'rgba(75, 71, 72, .9)',
      texture: "texture_asphalt_pattern"
    },
    "turn-lane": {
      name: 'Turn lane',
      defaultWidth: 10,
      color: 'rgba(75, 71, 72, .9)',
      texture: "texture_asphalt_pattern"
    },
    "bus-lane-inbound": {
      name: 'Bus lane',
      subname: 'Inbound',
      defaultWidth: 12,
      color: 'rgba(75, 71, 72, .9)',
      texture: "texture_asphalt_pattern"
    },
    "bus-lane-outbound": {
      name: 'Bus lane',
      subname: 'Outbound',
      defaultWidth: 12,
      color: 'rgba(75, 71, 72, .9)',
      texture: "texture_asphalt_pattern"
    },
    "small-median": {
      name: 'Small median',
      defaultWidth: 4,
      color: 'rgba(70, 120, 70, .8)',
      texture: "texture_grass_pattern"
    },
  };

  var segments = [
    { type: "sidewalk", width: 6 },
    { type: "sidewalk-tree", width: 6 },
    { type: "bike-lane-inbound", width: 6 },
    //{ type: "small-median", width: 4 },
    { type: "drive-lane-inbound", width: 10 },
    { type: "drive-lane-inbound", width: 10 },
    { type: "planting-strip", width: 4 },
    { type: "drive-lane-outbound", width: 10 },
    { type: "drive-lane-outbound", width: 10 },
    { type: "bike-lane-outbound", width: 6 },
    { type: "parking-lane", width: 8 },
    { type: "sidewalk-tree", width: 6 },
    { type: "sidewalk", width: 6 },
  ];

  var DRAGGING_TYPE_MOVE = 1;
  var DRAGGING_TYPE_CREATE = 2;

  var draggingStatus = {
    type: null,
    active: false,
    mouseX: null,
    mouseY: null,
    el: null,
    elX: null,
    elY: null,
    originalEl: null,
    originalWidth: null,
    originalDraggedOut: false,
    planview: false
  };

  main.draggingStatus = draggingStatus;

  var WIDTH_RESIZE_DELAY = 100;

  function _recalculateSeparators() {
    //console.log('Recalculating…');

    var els = document.querySelectorAll('#editable-street-section [type="separator"]');
    for (var i = 0, el; el = els[i]; i++) {
      var prevWidth = el.previousSibling ? el.previousSibling.offsetWidth : 0;
      var nextWidth = el.nextSibling ? el.nextSibling.offsetWidth : 0;

      //console.log(prevWidth, nextWidth);

      if (i == 0) {
        prevWidth = 2000;
      } else if (i == els.length - 1) {
        nextWidth = 2000;
      }

      el.style.width = (prevWidth / 2 + nextWidth / 2 + 2 + 100) + 'px';
      el.style.marginLeft = (-prevWidth / 2 - 1) + 'px';
      el.style.marginRight = (-nextWidth / 2 - 1 - 100) + 'px';
    }
  }

  function _createSegment(type, width) {
    var el = document.createElement('div');
    el.classList.add('segment');
    el.setAttribute('type', type);
    if (width) {
      el.style.width = width + 'px';
    }


    if (type == 'separator') {
      el.addEventListener('mouseover', _onSeparatorMouseOver, false);
      el.addEventListener('mouseout', _onSeparatorMouseOut, false);
    } else {
      el.innerHTML = 
          '<span class="name">' + SEGMENT_TYPES[type].name + '</span>' +
          '<span class="width">' + (width / 12).toFixed(1) + '\'</span>';
      el.dataset.name = SEGMENT_TYPES[type].name;
      el.dataset.width = (width / 12) * .3048;
      el.dataset.color = SEGMENT_TYPES[type].color
      el.dataset.texture = SEGMENT_TYPES[type].texture
    }
    return el;
  }

  function _createSegmentDom() {
    var el = _createSegment('separator');
    document.querySelector('#editable-street-section').appendChild(el);

    for (var i in segments) {
      var segment = segments[i];

      var el = _createSegment(segment.type, segment.width * WIDTH_MULTIPLIER, segment.name);
      document.querySelector('#editable-street-section').appendChild(el);

      var el = _createSegment('separator');
      document.querySelector('#editable-street-section').appendChild(el);
    }

    _recalculateSeparators();
  }

  function _onBodyMouseDown(event) {
    if (draggingStatus.planview) return;
    var el = event.target;
    if (!el.classList.contains('segment')) {
      return;
    }

    draggingStatus.active = true;
    document.querySelector('#editable-street-section').classList.add('dragging');

    draggingStatus.originalEl = event.target;

    if (draggingStatus.originalEl.classList.contains('tool')) {
      draggingStatus.type = DRAGGING_TYPE_CREATE;
    } else {
      draggingStatus.type = DRAGGING_TYPE_MOVE;      
    }

    draggingStatus.originalType = draggingStatus.originalEl.getAttribute('type');
    if (draggingStatus.type == DRAGGING_TYPE_MOVE) {
      draggingStatus.originalWidth = draggingStatus.originalEl.offsetWidth;
    } else {
      draggingStatus.originalWidth = draggingStatus.originalEl.offsetWidth / WIDTH_TOOL_MULTIPLIER * WIDTH_MULTIPLIER;      
    }

    draggingStatus.elX = event.pageX - event.offsetX;
    draggingStatus.elY = event.pageY - event.offsetY;

    if (draggingStatus.type == DRAGGING_TYPE_CREATE) {
      draggingStatus.elY -= 300;
      draggingStatus.elX -= draggingStatus.originalWidth / 3;
    }

    draggingStatus.mouseX = event.pageX;
    draggingStatus.mouseY = event.pageY;

    draggingStatus.el = document.createElement('div');
    draggingStatus.el.classList.add('segment');
    draggingStatus.el.classList.add('dragging');
    draggingStatus.el.setAttribute('type', draggingStatus.originalType);
    draggingStatus.el.style.width = draggingStatus.originalWidth + 'px';
    document.body.appendChild(draggingStatus.el);

    draggingStatus.el.style.left = draggingStatus.elX + 'px';
    draggingStatus.el.style.top = draggingStatus.elY + 'px';

    if (draggingStatus.type == DRAGGING_TYPE_MOVE) {
      draggingStatus.originalEl.classList.add('dragged-out');
      if (draggingStatus.originalEl.previousSibling) {
        draggingStatus.originalEl.previousSibling.parentNode.removeChild(draggingStatus.originalEl.previousSibling);
      }
      if (draggingStatus.originalEl.nextSibling) {
        draggingStatus.originalEl.nextSibling.parentNode.removeChild(draggingStatus.originalEl.nextSibling);
      }
      draggingStatus.originalDraggedOut = true;
    }

    event.preventDefault();
  }

  function _onBodyMouseMove(event) {
    if (draggingStatus.planview) return;
    if (draggingStatus.active) {
      var deltaX = event.pageX - draggingStatus.mouseX;
      var deltaY = event.pageY - draggingStatus.mouseY;

      draggingStatus.elX += deltaX;
      draggingStatus.elY += deltaY;

      draggingStatus.el.style.left = draggingStatus.elX + 'px';
      draggingStatus.el.style.top = draggingStatus.elY + 'px';

      draggingStatus.mouseX = event.pageX;
      draggingStatus.mouseY = event.pageY;
    }
  }

  function _onBodyMouseUp(event) {
    if (draggingStatus.planview) return;
    if (!draggingStatus.active) {
      return;
    }

    var el = event.target;
    while (el && (el.id != 'editable-street-canvas')) {
      el = el.parentNode;
    }
    var withinCanvas = !!el;

    draggingStatus.active = false;
    document.querySelector('#editable-street-section').classList.remove('dragging');

    var placeEl = document.querySelector('#editable-street-section [type="separator"].hover');

    draggingStatus.el.parentNode.removeChild(draggingStatus.el);


    if (placeEl) {
      var el = _createSegment('separator');
      document.querySelector('#editable-street-section').insertBefore(el, placeEl);
      
      var el = _createSegment(draggingStatus.originalType, draggingStatus.originalWidth);
      document.querySelector('#editable-street-section').insertBefore(el, placeEl);

      // animation
      el.style.width = 50 + 'px';
      window.setTimeout(function() {
        el.style.width = draggingStatus.originalWidth + 'px';
      }, 0);

      _recalculateSeparators();
    } else {
      if (!withinCanvas) {
        _dragOutOriginalIfNecessary();
      } else {
        draggingStatus.originalEl.classList.remove('dragged-out');

        var el = _createSegment('separator');
        document.querySelector('#editable-street-section').insertBefore(el, draggingStatus.originalEl);

        var el = _createSegment('separator');
        document.querySelector('#editable-street-section').insertBefore(el, draggingStatus.originalEl.nextSibling);

      }
    }

    event.preventDefault();
  }

  function _dragOutOriginalIfNecessary() {
    if ((draggingStatus.type == DRAGGING_TYPE_MOVE) && draggingStatus.originalDraggedOut) {
      var el = _createSegment('separator');
      document.querySelector('#editable-street-section').insertBefore(el, draggingStatus.originalEl);

      draggingStatus.originalEl.style.width = 0;
      window.setTimeout(function() {
        draggingStatus.originalEl.parentNode.removeChild(draggingStatus.originalEl);
        _recalculateSeparators();
      }, WIDTH_RESIZE_DELAY);

      _recalculateSeparators();

      draggingStatus.originalDraggedOut = false;
    }
  }

  function _onSeparatorMouseOver(event) {
    _dragOutOriginalIfNecessary();

    event.target.classList.add('hover');
  }
  function _onSeparatorMouseOut(event) {
    event.target.classList.remove('hover');
  }

  function _createTools() {
    for (var i in SEGMENT_TYPES) {
      var segmentType = SEGMENT_TYPES[i];
      var el = _createSegment(i, segmentType.defaultWidth * WIDTH_TOOL_MULTIPLIER);

      el.classList.add('tool');

      document.querySelector('#tools').appendChild(el);
    }
  }

  main.init = function(){
    _createTools();

    _createSegmentDom();

    window.addEventListener('touchstart', _onBodyMouseDown, false);
    window.addEventListener('touchmove', _onBodyMouseMove, false);
    window.addEventListener('touchend', _onBodyMouseUp, false);

    window.addEventListener('mousedown', _onBodyMouseDown, false);
    window.addEventListener('mousemove', _onBodyMouseMove, false);
    window.addEventListener('mouseup', _onBodyMouseUp, false);
  }

  return main;
})();
