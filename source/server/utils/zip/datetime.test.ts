import { DateTime } from "./datetime";



describe("dates conversion", function(){
  it("can convert date to dos", function(){
    expect(DateTime.toDos(new Date('2023-03-29T13:02:10.000Z'))).to.equal(1451059269);
  });
  it("can convert dos to date", function(){
    let d = DateTime.toUnix(1451059269);
    expect(d.toISOString()).to.equal('2023-03-29T13:02:10.000Z');
  });

  it("random dates", function(){
    const delta = (v:number)=>Math.floor(Math.random()*v);
    for(let i = 0; i < 10; i++){
      let date = new Date(
        1980+ delta(50),
        delta(12),
        delta(28),
        delta(24),
        delta(60),
        Math.floor(delta(60)/2)*2,
      );
      let n = DateTime.toDos(date);
      expect(DateTime.toUnix(n).toISOString()).to.equal(date.toISOString());
    }
  })
});
