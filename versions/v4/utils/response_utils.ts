const HEADER_ACCESS_CONTROL_ALLOW_ORIGIN_NAME = "Access-Control-Allow-Origin";
const HEADER_ACCESS_CONTROL_ALLOW_ORIGIN_VALUE = "*";

export function addAccessControlAllowOriginHeader(headers: Headers) {
  headers.set(
    HEADER_ACCESS_CONTROL_ALLOW_ORIGIN_NAME,
    HEADER_ACCESS_CONTROL_ALLOW_ORIGIN_VALUE
  );
}
