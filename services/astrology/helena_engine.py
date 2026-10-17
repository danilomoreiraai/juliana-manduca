"""HELENA's stateless natal boundary. No database, customer identity or original assets."""
from datetime import date
from itertools import combinations
import math
import re
from threading import Lock

import swisseph as swe

FIELDS = {'date', 'time', 'utcOffsetMinutes', 'latitude', 'longitude', 'houseSystem', 'zodiac'}
BODIES = (
    ('sun', swe.SUN), ('moon', swe.MOON), ('mercury', swe.MERCURY), ('venus', swe.VENUS),
    ('mars', swe.MARS), ('jupiter', swe.JUPITER), ('saturn', swe.SATURN),
    ('uranus', swe.URANUS), ('neptune', swe.NEPTUNE), ('pluto', swe.PLUTO),
)
ASPECTS = (
    ('conjunction', 0, 8), ('sextile', 60, 4), ('square', 90, 6),
    ('trine', 120, 6), ('opposition', 180, 8),
)
CALCULATION_LOCK = Lock()


def angular_distance(a, b):
    return abs((a - b + 180) % 360 - 180)


def validate_input(value):
    if not isinstance(value, dict) or set(value) != FIELDS:
        raise ValueError('Dados de cálculo inválidos')
    if not isinstance(value['date'], str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value['date']):
        raise ValueError('Data inválida')
    try:
        day = date.fromisoformat(value['date'])
    except ValueError:
        raise ValueError('Data inválida') from None
    if not 1600 <= day.year <= 2399:
        raise ValueError('Use uma data entre 1600 e 2399')
    if not isinstance(value['time'], str) or not re.fullmatch(
        r'(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?', value['time']
    ):
        raise ValueError('Hora inválida')
    for field in ('latitude', 'longitude', 'utcOffsetMinutes'):
        if type(value[field]) not in (float, int) or not math.isfinite(value[field]):
            raise ValueError('Coordenadas ou fuso inválidos')
    if not -90 < value['latitude'] < 90 or not -180 <= value['longitude'] <= 180:
        raise ValueError('Coordenadas inválidas')
    offset = value['utcOffsetMinutes']
    if offset != int(offset) or not -840 <= offset <= 840:
        raise ValueError('Fuso inválido')
    if value['houseSystem'] not in ('P', 'K', 'E', 'W'):
        raise ValueError('Sistema de casas não suportado')
    if value['zodiac'] not in ('tropical', 'lahiri', 'fagan_bradley'):
        raise ValueError('Zodíaco não suportado')
    return day


def occupied_house(longitude, cusps):
    for index, cusp in enumerate(cusps):
        width = (cusps[(index + 1) % 12] - cusp) % 360
        if (longitude - cusp) % 360 < width:
            return index + 1
    raise ValueError('Não foi possível determinar a casa do planeta')


def calculate_aspects(bodies):
    result = []
    for a, b in combinations(bodies, 2):
        separation = angular_distance(a['longitude'], b['longitude'])
        for name, angle, limit in ASPECTS:
            orb = abs(separation - angle)
            if orb > limit:
                continue
            future = angular_distance(
                a['longitude'] + a['speed'] / 86400,
                b['longitude'] + b['speed'] / 86400,
            )
            phase = 'exact' if orb < 1e-7 else (
                'applying' if abs(future - angle) < orb else 'separating'
            )
            result.append({
                'bodyA': a['id'], 'bodyB': b['id'], 'type': name,
                'angle': angle, 'orb': orb, 'phase': phase,
            })
    return result


def calculate_natal(value):
    day = validate_input(value)
    parts = [int(part) for part in value['time'].split(':')]
    local_hour = parts[0] + parts[1] / 60 + (parts[2] if len(parts) == 3 else 0) / 3600
    jd = swe.julday(day.year, day.month, day.day, local_hour, swe.GREG_CAL)
    jd -= value['utcOffsetMinutes'] / 1440
    flags = swe.FLG_MOSEPH | swe.FLG_SPEED
    sidereal = value['zodiac'] != 'tropical'
    mode = swe.SIDM_LAHIRI if value['zodiac'] == 'lahiri' else swe.SIDM_FAGAN_BRADLEY
    with CALCULATION_LOCK:
        swe.set_sid_mode(mode)
        if sidereal:
            flags |= swe.FLG_SIDEREAL
        try:
            cusps, angles = swe.houses_ex(
                jd, value['latitude'], value['longitude'], value['houseSystem'].encode('ascii'),
                swe.FLG_SIDEREAL if sidereal else 0,
            )
            houses = [cusp % 360 for cusp in cusps[1:]]
            if len(houses) != 12:
                raise ValueError('Resultado de casas incompatível')
            bodies = []
            for identifier, planet in BODIES:
                position, returned_flags, warning = swe.calc_ut(jd, planet, flags)
                actual_ephemeris = returned_flags & (swe.FLG_MOSEPH | swe.FLG_SWIEPH | swe.FLG_JPLEPH)
                if actual_ephemeris != swe.FLG_MOSEPH or warning:
                    raise ValueError('Efeméride solicitada indisponível')
                longitude = position[0] % 360
                bodies.append({
                    'id': identifier, 'longitude': longitude, 'latitude': position[1],
                    'speed': position[3], 'retrograde': position[3] < 0,
                    'house': occupied_house(longitude, houses),
                })
            ayanamsa = swe.get_ayanamsa_ut(jd) % 360 if sidereal else 0
        except swe.Error:
            raise ValueError('Não foi possível calcular nesta data, latitude e sistema de casas') from None
    return {
        'protocol': 'helena.natal.v1',
        'engine': {'name': 'Swiss Ephemeris', 'version': swe.version, 'bindingVersion': '2.10.3.6'},
        'ephemeris': 'moshier', 'input': dict(value), 'julianDayUt': jd,
        'ayanamsa': ayanamsa, 'ascendant': angles[0] % 360, 'midheaven': angles[1] % 360,
        'bodies': bodies, 'houses': houses, 'aspects': calculate_aspects(bodies),
    }
