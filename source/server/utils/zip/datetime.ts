
/**
 * DOS time structure conversion
 * @see https://learn.microsoft.com/fr-fr/windows/win32/api/winbase/nf-winbase-dosdatetimetofiletime?redirectedfrom=MSDN
 */
export class DateTime {
  static toDos(d :Date):number{
    return (0
    | Math.floor(d.getUTCSeconds()/2)
    | d.getUTCMinutes() << 5
    | d.getUTCHours() << 11
    ) /* time */| ((
      0
      | d.getUTCDate()
      | (d.getUTCMonth()+1 /* months start at 1 */) <<5
      | (d.getUTCFullYear() - 1980) << 9
    ) << 16 ); /* date */
  }
  static toUnix( d :number){
    let time = d & 0xFFFF;
    let date = d >>> 16;
    return new Date(Date.UTC(
      (date >>> 9) + 1980,
      ((date >>> 5) & 0x0F) -1,
      (date & 0x1F),
      (time >>> 11),
      ((time >>> 5) & 0x3F),
      (time & 0x1F)*2,
      0
    ));
  }
}