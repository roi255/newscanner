/* checksum.ts — reproduces OSIM's request checksum:
 *   sha1( md5( token . json_encode(requestData) ) )           (apiapp.php:358)
 *
 * PHP's json_encode escapes forward slashes and non-ASCII by default, so we
 * post-process JSON.stringify to match, maximising the chance the server-side
 * recomputed checksum agrees. (Note: OSIM currently bypasses the checksum in
 * the `development` environment and via an early return in api.php, so exact
 * byte-parity isn't load-bearing yet — but we match PHP defaults regardless.) */
import { md5 } from "js-md5";
import { sha1 } from "js-sha1";

/** Mimic PHP json_encode() defaults: escape "/" -> "\/" and non-ASCII -> \uXXXX. */
export function phpJsonEncode(value: unknown): string {
  let json = JSON.stringify(value);
  json = json.replace(/\//g, "\\/");
  json = json.replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  return json;
}

export function osimChecksum(token: string, requestData: unknown): string {
  return sha1(md5(token + phpJsonEncode(requestData)));
}
