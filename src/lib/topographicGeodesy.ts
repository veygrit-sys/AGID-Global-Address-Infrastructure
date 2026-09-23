import proj4 from 'proj4';

const DEGREES_TO_RADIANS = Math.PI / 180;
const EPSG_4978_DEFINITION =
  '+proj=geocent +datum=WGS84 +units=m +no_defs +type=crs';

export type TopographicEnuFrame = {
  origin: {
    longitudeDegrees: number;
    latitudeDegrees: number;
    ellipsoidalHeightMeters: number;
    ecefMeters: [number, number, number];
  };
  axes: {
    east: [number, number, number];
    north: [number, number, number];
    up: [number, number, number];
  };
  enuToEcefTransform: number[];
};

function requireGeodeticPosition(
  longitudeDegrees: number,
  latitudeDegrees: number,
  ellipsoidalHeightMeters: number,
) {
  if (
    !Number.isFinite(longitudeDegrees)
    || longitudeDegrees < -180
    || longitudeDegrees > 180
    || !Number.isFinite(latitudeDegrees)
    || latitudeDegrees < -90
    || latitudeDegrees > 90
    || !Number.isFinite(ellipsoidalHeightMeters)
  ) {
    throw new Error(
      'WGS 84 position requires finite longitude, latitude, and ellipsoidal height.',
    );
  }
}

export function geodeticToEcefPoint(
  longitudeDegrees: number,
  latitudeDegrees: number,
  ellipsoidalHeightMeters: number,
): [number, number, number] {
  requireGeodeticPosition(
    longitudeDegrees,
    latitudeDegrees,
    ellipsoidalHeightMeters,
  );
  if (!proj4.defs('EPSG:4978')) {
    proj4.defs('EPSG:4978', EPSG_4978_DEFINITION);
  }
  const result = proj4(
    'EPSG:4326',
    'EPSG:4978',
    [longitudeDegrees, latitudeDegrees, ellipsoidalHeightMeters],
  );
  if (
    result.length < 3
    || !result.slice(0, 3).every(Number.isFinite)
  ) {
    throw new Error('WGS 84 position could not be converted to EPSG:4978.');
  }
  return [result[0], result[1], result[2]];
}

export function createTopographicEnuFrame(
  longitudeDegrees: number,
  latitudeDegrees: number,
  ellipsoidalHeightMeters = 0,
): TopographicEnuFrame {
  const originEcef = geodeticToEcefPoint(
    longitudeDegrees,
    latitudeDegrees,
    ellipsoidalHeightMeters,
  );
  const longitude = longitudeDegrees * DEGREES_TO_RADIANS;
  const latitude = latitudeDegrees * DEGREES_TO_RADIANS;
  const sinLongitude = Math.sin(longitude);
  const cosLongitude = Math.cos(longitude);
  const sinLatitude = Math.sin(latitude);
  const cosLatitude = Math.cos(latitude);
  const east: [number, number, number] = [
    -sinLongitude,
    cosLongitude,
    0,
  ];
  const north: [number, number, number] = [
    -sinLatitude * cosLongitude,
    -sinLatitude * sinLongitude,
    cosLatitude,
  ];
  const up: [number, number, number] = [
    cosLatitude * cosLongitude,
    cosLatitude * sinLongitude,
    sinLatitude,
  ];
  const enuToEcefTransform = [
    ...east, 0,
    ...north, 0,
    ...up, 0,
    ...originEcef, 1,
  ];
  if (!enuToEcefTransform.every(Number.isFinite)) {
    throw new Error('ENU to ECEF transform contains a non-finite value.');
  }
  return {
    origin: {
      longitudeDegrees,
      latitudeDegrees,
      ellipsoidalHeightMeters,
      ecefMeters: originEcef,
    },
    axes: { east, north, up },
    enuToEcefTransform,
  };
}

export function ecefToEnuPoint(
  ecefPoint: [number, number, number],
  frame: TopographicEnuFrame,
): [number, number, number] {
  const delta = ecefPoint.map(
    (value, index) => value - frame.origin.ecefMeters[index],
  ) as [number, number, number];
  const dot = (axis: [number, number, number]) => (
    axis[0] * delta[0]
    + axis[1] * delta[1]
    + axis[2] * delta[2]
  );
  return [
    dot(frame.axes.east),
    dot(frame.axes.north),
    dot(frame.axes.up),
  ];
}

export function geodeticToEnuPoint(
  longitudeDegrees: number,
  latitudeDegrees: number,
  ellipsoidalHeightMeters: number,
  frame: TopographicEnuFrame,
): [number, number, number] {
  return ecefToEnuPoint(
    geodeticToEcefPoint(
      longitudeDegrees,
      latitudeDegrees,
      ellipsoidalHeightMeters,
    ),
    frame,
  );
}

export function enuToEcefPoint(
  enuPoint: [number, number, number],
  frame: TopographicEnuFrame,
): [number, number, number] {
  const [east, north, up] = enuPoint;
  return [0, 1, 2].map(index => (
    frame.origin.ecefMeters[index]
    + frame.axes.east[index] * east
    + frame.axes.north[index] * north
    + frame.axes.up[index] * up
  )) as [number, number, number];
}
