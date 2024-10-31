export function forAll(aColl) {
  return new ForAll(aColl)
}

class ForAll {
  constructor(aColl) {
    this.coll = aColl
  }

  do(aFn) {
    let coll = this.coll; if ( ! coll ) return
    for ( var i = 0; i < coll.length; i++ ) {
      let res = aFn(coll[i])
      if ( res === "continue" ) continue
      if ( res === "break" ) break
    }
  }

  async waitOn(aFn) {
    let coll = this.coll; if ( ! coll ) return
    for ( var i = 0; i < coll.length; i++ ) {
      let res = await aFn(coll[i])
      if ( res === "continue" ) continue
      if ( res === "break" ) break
    }
  }
}

