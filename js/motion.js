if (window.$ && window.$.Velocity) window.Velocity = window.$.Velocity;
NexT.motion = {};
NexT.motion.integrator = {
  queue: [],
  cursor: -1,
  init: function () {
    this.queue = [];
    this.cursor = -1;
    return this;
  },
  add: function (fn) {
    this.queue.push(fn);
    return this;
  },
  next: function () {
    this.cursor++;
    var fn = this.queue[this.cursor];
    typeof fn === 'function' && fn(NexT.motion.integrator);
  },
  bootstrap: function () {
    this.next();
  }
};
NexT.motion.middleWares = {
  logo: function (integrator) {
    var sequence = [];
    var brand = document.querySelector('.brand');
    var image = document.querySelector('.custom-logo-image');
    var title = document.querySelector('.site-title');
    var subtitle = document.querySelector('.site-subtitle');
    var logoLineTop = document.querySelector('.logo-line-before i');
    var logoLineBottom = document.querySelector('.logo-line-after i');
    brand && sequence.push({
      e: brand,
      p: { opacity: 1 },
      o: { duration: 200 }
    });
    function getMistLineSettings(element, translateX) {
      return {
        e: element,
        p: { translateX: translateX },
        o: {
          duration: 500,
          sequenceQueue: false
        }
      };
    }
    function pushImageToSequence() {
      sequence.push({
        e: image,
        p: { opacity: 1, top: 0 },
        o: { duration: 200 }
      });
    }
    title && sequence.push({
      e: title,
      p: { opacity: 1, top: 0 },
      o: { duration: 200 }
    });
    subtitle && sequence.push({
      e: subtitle,
      p: { opacity: 1, top: 0 },
      o: { duration: 200 }
    });
    image && pushImageToSequence();
    if (sequence.length > 0) {
      sequence[sequence.length - 1].o.complete = function () {
        integrator.next();
      };
      Velocity.RunSequence(sequence);
    } else {
      integrator.next();
    }
  },
  menu: function (integrator) {
    Velocity(document.querySelectorAll('.menu-item'), 'transition.slideDownIn', {
      display: null,
      duration: 200,
      complete: function () {
        integrator.next();
      }
    });
  },
  postList: function (integrator) {
    var postBlock = document.querySelectorAll('.post-block, .pagination, .comments');
    var postBlockTransition = 'fadeIn';
    var postHeader = document.querySelectorAll('.post-header');
    var postHeaderTransition = 'slideDownIn';
    var postBody = document.querySelectorAll('.post-body');
    var postBodyTransition = 'slideDownIn';
    var collHeader = document.querySelectorAll('.collection-header');
    var collHeaderTransition = 'slideLeftIn';
    var hasPost = postBlock.length > 0;
    if (hasPost) {
      var postMotionOptions = window.postMotionOptions || {
        stagger: 100,
        drag: true,
        complete: function () {
          integrator.next();
        }
      };
      Velocity(postBlock, 'transition.' + postBlockTransition, postMotionOptions);
      Velocity(postHeader, 'transition.' + postHeaderTransition, postMotionOptions);
      Velocity(postBody, 'transition.' + postBodyTransition, postMotionOptions);
      Velocity(collHeader, 'transition.' + collHeaderTransition, postMotionOptions);
    }
    integrator.next();
  },
  sidebar: function (integrator) {
    NexT.utils.updateSidebarPosition();
    var sidebarAffix = document.querySelector('.sidebar-inner');
    var sidebarAffixTransition = 'slideUpIn';
    Velocity(sidebarAffix, 'transition.' + sidebarAffixTransition, {
      display: null,
      duration: 200,
      complete: function () {
        sidebarAffix.style.transform = 'initial';
      }
    });
    integrator.next();
  }
};