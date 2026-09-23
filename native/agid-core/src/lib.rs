const K: u32 = 2_097_152; // 2^21
const M: u32 = 2_097_151; // 2^21 - 1
const MAX_GRID_CELLS: usize = 12_000;
const GRID_VALUES_PER_CELL: usize = 8;

static mut GRID_BUFFER: [f64; MAX_GRID_CELLS * GRID_VALUES_PER_CELL] =
    [0.0; MAX_GRID_CELLS * GRID_VALUES_PER_CELL];
static mut GRID_COUNT: u32 = 0;
static mut GRID_FACE: u32 = 0;
static mut GRID_START_QX: u32 = 0;
static mut GRID_START_QY: u32 = 0;
static mut GRID_END_QX: u32 = 0;
static mut GRID_END_QY: u32 = 0;
static mut GRID_STEP: u32 = 1;

#[inline]
fn apply_equal_area(val: f64) -> f64 {
    (val * std::f64::consts::PI / 4.0).tan()
}

#[inline]
fn invert_equal_area(val: f64) -> f64 {
    val.atan() * 4.0 / std::f64::consts::PI
}

fn get_quantized(lat: f64, lon: f64) -> (u32, u32, u32) {
    let phi = lat * std::f64::consts::PI / 180.0;
    let theta = lon * std::f64::consts::PI / 180.0;

    let x = phi.cos() * theta.cos();
    let y = phi.cos() * theta.sin();
    let z = phi.sin();

    let abs_x = x.abs();
    let abs_y = y.abs();
    let abs_z = z.abs();

    let (face, uc, vc) = if abs_x >= abs_y && abs_x >= abs_z {
        if x > 0.0 {
            (0u32, y, z)
        } else {
            (1u32, -y, z)
        }
    } else if abs_y >= abs_x && abs_y >= abs_z {
        if y > 0.0 {
            (2u32, -x, z)
        } else {
            (3u32, x, z)
        }
    } else if z > 0.0 {
        (4u32, -x, -y)
    } else {
        (5u32, -x, y)
    };

    let max_val = abs_x.max(abs_y).max(abs_z);
    let xi = uc / max_val;
    let eta = vc / max_val;

    let u = 0.5 * (invert_equal_area(xi) + 1.0);
    let v = 0.5 * (invert_equal_area(eta) + 1.0);

    let qx = ((u * K as f64).floor() as i64).clamp(0, M as i64) as u32;
    let qy = ((v * K as f64).floor() as i64).clamp(0, M as i64) as u32;
    (face, qx, qy)
}

fn get_from_quantized(face: u32, qx: u32, qy: u32) -> (f64, f64) {
    let u = (qx as f64 / K as f64) * 2.0 - 1.0;
    let v = (qy as f64 / K as f64) * 2.0 - 1.0;

    let xi = apply_equal_area(u);
    let eta = apply_equal_area(v);

    let (mut x, mut y, mut z) = match face {
        0 => (1.0, xi, eta),
        1 => (-1.0, -xi, eta),
        2 => (-xi, 1.0, eta),
        3 => (xi, -1.0, eta),
        4 => (-xi, -eta, 1.0),
        5 => (-xi, eta, -1.0),
        _ => (1.0, xi, eta),
    };

    let length = (x * x + y * y + z * z).sqrt();
    x /= length;
    y /= length;
    z /= length;

    let lat = z.asin() * 180.0 / std::f64::consts::PI;
    let lon = y.atan2(x) * 180.0 / std::f64::consts::PI;
    (lat, lon)
}

#[inline]
fn rot(n: u32, mut x: u32, mut y: u32, rx: u32, ry: u32) -> (u32, u32) {
    if ry == 0 {
        if rx == 1 {
            x = n - 1 - x;
            y = n - 1 - y;
        }
        return (y, x);
    }
    (x, y)
}

fn encode_hilbert(n: u32, mut x: u32, mut y: u32) -> u64 {
    let mut d = 0u64;
    let mut s = n / 2;
    while s > 0 {
        let rx = if (x & s) > 0 { 1u32 } else { 0u32 };
        let ry = if (y & s) > 0 { 1u32 } else { 0u32 };
        d += (s as u64) * (s as u64) * (((3 * rx) ^ ry) as u64);
        let (nx, ny) = rot(s, x, y, rx, ry);
        x = nx;
        y = ny;
        s /= 2;
    }
    d
}

fn decode_hilbert(n: u32, d: u64) -> (u32, u32) {
    let mut x = 0u32;
    let mut y = 0u32;
    let mut t = d;
    let mut s = 1u32;

    while s < n {
        let rx = ((t / 2) & 1) as u32;
        let ry = ((t ^ rx as u64) & 1) as u32;
        let (nx, ny) = rot(s, x, y, rx, ry);
        x = nx + s * rx;
        y = ny + s * ry;
        t /= 4;
        s *= 2;
    }
    (x, y)
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_get_quantized_face(lat: f64, lon: f64) -> u32 {
    let (face, _, _) = get_quantized(lat, lon);
    face
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_get_quantized_qx(lat: f64, lon: f64) -> u32 {
    let (_, qx, _) = get_quantized(lat, lon);
    qx
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_get_quantized_qy(lat: f64, lon: f64) -> u32 {
    let (_, _, qy) = get_quantized(lat, lon);
    qy
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_encode_hilbert_hi(qx: u32, qy: u32) -> u32 {
    let d = encode_hilbert(K, qx.min(M), qy.min(M));
    (d >> 32) as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_encode_hilbert_lo(qx: u32, qy: u32) -> u32 {
    let d = encode_hilbert(K, qx.min(M), qy.min(M));
    (d & 0xFFFF_FFFF) as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_decode_hilbert_x(hi: u32, lo: u32) -> u32 {
    let d = ((hi as u64) << 32) | lo as u64;
    let (x, _) = decode_hilbert(K, d);
    x
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_decode_hilbert_y(hi: u32, lo: u32) -> u32 {
    let d = ((hi as u64) << 32) | lo as u64;
    let (_, y) = decode_hilbert(K, d);
    y
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_get_lat(face: u32, qx: u32, qy: u32) -> f64 {
    let (lat, _) = get_from_quantized(face, qx.min(M), qy.min(M));
    lat
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_get_lon(face: u32, qx: u32, qy: u32) -> f64 {
    let (_, lon) = get_from_quantized(face, qx.min(M), qy.min(M));
    lon
}

fn grid_step_for_zoom(zoom: f64) -> u32 {
    let exponent = (18.5 - zoom).floor().max(0.0);
    let ideal_step = 2.0_f64.powf(exponent);
    let mut final_step = 1u32;
    while (final_step * 2) as f64 <= ideal_step && final_step < 131_072 {
        final_step *= 2;
    }
    final_step
}

fn is_valid_lat_lon(lat: f64, lon: f64) -> bool {
    lat.is_finite() && lon.is_finite() && (-90.0..=90.0).contains(&lat)
}

fn normalize_lon(lon: f64) -> f64 {
    let mut normalized = (lon + 180.0) % 360.0;
    if normalized < 0.0 {
        normalized += 360.0;
    }
    normalized - 180.0
}

fn haversine_distance_meters(lat_a: f64, lon_a: f64, lat_b: f64, lon_b: f64) -> f64 {
    let lat_a_rad = lat_a * std::f64::consts::PI / 180.0;
    let lat_b_rad = lat_b * std::f64::consts::PI / 180.0;
    let delta_lat = (lat_b - lat_a) * std::f64::consts::PI / 180.0;
    let delta_lon = (lon_b - lon_a) * std::f64::consts::PI / 180.0;
    let h = (delta_lat / 2.0).sin().powi(2)
        + lat_a_rad.cos() * lat_b_rad.cos() * (delta_lon / 2.0).sin().powi(2);
    2.0 * 6_371_008.8 * h.sqrt().min(1.0).asin()
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_zkp_quality_threshold_satisfied(score_percent: u32, threshold_percent: u32) -> u32 {
    if score_percent > 100 || threshold_percent > 100 {
        return 0;
    }
    (score_percent >= threshold_percent) as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_zkp_point_in_bbox(
    lat: f64,
    lon: f64,
    north: f64,
    south: f64,
    west: f64,
    east: f64,
) -> u32 {
    if !is_valid_lat_lon(lat, lon)
        || !north.is_finite()
        || !south.is_finite()
        || !west.is_finite()
        || !east.is_finite()
        || north < south
        || north > 90.0
        || south < -90.0
    {
        return 0;
    }
    if lat < south || lat > north {
        return 0;
    }

    let lon = normalize_lon(lon);
    let west = normalize_lon(west);
    let east = normalize_lon(east);
    let inside_lon = if west <= east {
        lon >= west && lon <= east
    } else {
        lon >= west || lon <= east
    };
    inside_lon as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_zkp_point_in_circle(
    lat: f64,
    lon: f64,
    center_lat: f64,
    center_lon: f64,
    radius_meters: f64,
) -> u32 {
    if !is_valid_lat_lon(lat, lon)
        || !is_valid_lat_lon(center_lat, center_lon)
        || !radius_meters.is_finite()
        || radius_meters < 0.0
    {
        return 0;
    }
    (haversine_distance_meters(lat, lon, center_lat, center_lon) <= radius_meters) as u32
}

fn write_cell_to_grid_buffer(index: usize, face: u32, x: u32, y: u32, step: u32) {
    let p1 = get_from_quantized(face, x, y);
    let p2 = get_from_quantized(face, x.saturating_add(step).min(M), y);
    let p3 = get_from_quantized(face, x.saturating_add(step).min(M), y.saturating_add(step).min(M));
    let p4 = get_from_quantized(face, x, y.saturating_add(step).min(M));
    let points = [p1, p2, p3, p4];
    let ref_lon = p1.1;
    let base = index * GRID_VALUES_PER_CELL;

    for (point_index, (lat, lon)) in points.iter().enumerate() {
        let mut shifted_lon = *lon;
        if shifted_lon - ref_lon > 180.0 {
            shifted_lon -= 360.0;
        } else if shifted_lon - ref_lon < -180.0 {
            shifted_lon += 360.0;
        }

        unsafe {
            GRID_BUFFER[base + point_index * 2] = shifted_lon;
            GRID_BUFFER[base + point_index * 2 + 1] = *lat;
        }
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_generate_grid_cells(lat: f64, lon: f64, zoom: f64, range_cells: u32) -> u32 {
    let (face, qx, qy) = get_quantized(lat, lon);
    let step = grid_step_for_zoom(zoom);
    let range = range_cells.max(1).min(100);
    let half = range / 2;
    let start_qx = qx.saturating_sub(step.saturating_mul(half));
    let start_qy = qy.saturating_sub(step.saturating_mul(half));
    let max_count = MAX_GRID_CELLS as u32;

    let mut count = 0u32;
    for row in 0..range {
        for col in 0..range {
            if count >= max_count {
                break;
            }
            let x = start_qx.saturating_add(col.saturating_mul(step)).min(M);
            let y = start_qy.saturating_add(row.saturating_mul(step)).min(M);
            write_cell_to_grid_buffer(count as usize, face, x, y, step);
            count += 1;
        }
    }

    unsafe {
        GRID_COUNT = count;
        GRID_FACE = face;
        GRID_START_QX = start_qx;
        GRID_START_QY = start_qy;
        GRID_END_QX = start_qx.saturating_add(range.saturating_mul(step)).min(M);
        GRID_END_QY = start_qy.saturating_add(range.saturating_mul(step)).min(M);
        GRID_STEP = step;
    }

    count
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_grid_buffer_ptr() -> *const f64 {
    unsafe { GRID_BUFFER.as_ptr() }
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_grid_buffer_len() -> u32 {
    unsafe { GRID_COUNT * GRID_VALUES_PER_CELL as u32 }
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_grid_face() -> u32 {
    unsafe { GRID_FACE }
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_grid_start_qx() -> u32 {
    unsafe { GRID_START_QX }
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_grid_start_qy() -> u32 {
    unsafe { GRID_START_QY }
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_grid_end_qx() -> u32 {
    unsafe { GRID_END_QX }
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_grid_end_qy() -> u32 {
    unsafe { GRID_END_QY }
}

#[unsafe(no_mangle)]
pub extern "C" fn agid_grid_step() -> u32 {
    unsafe { GRID_STEP }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn grid_generation_reports_count_and_layout() {
        let count = agid_generate_grid_cells(35.0, 139.0, 18.0, 4);

        assert_eq!(count, 16);
        assert_eq!(agid_grid_buffer_len(), 16 * 8);
        assert!(agid_grid_step() >= 1);
        assert!(agid_grid_start_qx() <= agid_grid_end_qx());
        assert!(agid_grid_start_qy() <= agid_grid_end_qy());
    }

    #[test]
    fn grid_generation_writes_finite_lon_lat_pairs() {
        let count = agid_generate_grid_cells(35.0, 139.0, 18.0, 2);
        let ptr = agid_grid_buffer_ptr();
        let values = unsafe { std::slice::from_raw_parts(ptr, count as usize * 8) };

        for pair in values.chunks_exact(2) {
            assert!(pair[0].is_finite());
            assert!(pair[1].is_finite());
            assert!(pair[0] >= -540.0 && pair[0] <= 540.0);
            assert!(pair[1] >= -90.0 && pair[1] <= 90.0);
        }
    }

    #[test]
    fn zkp_quality_threshold_predicate_uses_bounded_percent_values() {
        assert_eq!(agid_zkp_quality_threshold_satisfied(92, 85), 1);
        assert_eq!(agid_zkp_quality_threshold_satisfied(84, 85), 0);
        assert_eq!(agid_zkp_quality_threshold_satisfied(101, 85), 0);
        assert_eq!(agid_zkp_quality_threshold_satisfied(92, 101), 0);
    }

    #[test]
    fn zkp_bbox_predicate_handles_antimeridian_regions() {
        assert_eq!(agid_zkp_point_in_bbox(35.0, 139.0, 36.0, 34.0, 138.0, 140.0), 1);
        assert_eq!(agid_zkp_point_in_bbox(35.0, 141.0, 36.0, 34.0, 138.0, 140.0), 0);
        assert_eq!(agid_zkp_point_in_bbox(10.0, 179.0, 20.0, 0.0, 170.0, -170.0), 1);
        assert_eq!(agid_zkp_point_in_bbox(10.0, 0.0, 20.0, 0.0, 170.0, -170.0), 0);
    }

    #[test]
    fn zkp_circle_predicate_uses_haversine_distance() {
        assert_eq!(agid_zkp_point_in_circle(35.0, 139.0, 35.0, 139.0, 1.0), 1);
        assert_eq!(agid_zkp_point_in_circle(35.001, 139.0, 35.0, 139.0, 200.0), 1);
        assert_eq!(agid_zkp_point_in_circle(36.0, 139.0, 35.0, 139.0, 200.0), 0);
        assert_eq!(agid_zkp_point_in_circle(35.0, 139.0, 35.0, 139.0, -1.0), 0);
    }
}
