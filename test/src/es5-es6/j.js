const suman = require('suman');
const Test = suman.init(module, {
  $inject: ['abc']
});


Test.create(['parallel : true', 'timeout:3000', function (assert, before, beforeEach, it, after) {

  console.log('opts => ',this.opts);

  function makePromise(){
    return new Promise(function(resolve){
        setTimeout(resolve,1000);
    })
  }


  it('is one', t => {
      return makePromise();
  });


  it('is one', t => {
    return makePromise();
  });


  it('is one', t => {
    return makePromise();
  });


  it('is one', t => {
    return makePromise();
  });



}]);
