"""Synthetic numerical regression and boundary tests; not legacy parity certification."""
import importlib.util
import math
import unittest

SPEC = importlib.util.find_spec('helena_engine')
if SPEC:
    from helena_engine import calculate_natal, angular_distance
else:
    calculate_natal = None
    angular_distance = None

BASE = {
    'date': '2000-01-01', 'time': '12:00:00', 'utcOffsetMinutes': 0,
    'latitude': -23.5505, 'longitude': -46.6333,
    'houseSystem': 'P', 'zodiac': 'tropical',
}


class EngineTest(unittest.TestCase):
    def calculate(self, **patch):
        self.assertIsNotNone(calculate_natal, 'HELENA numerical engine has not been implemented')
        return calculate_natal({**BASE, **patch})

    def test_j2000_and_complete_finite_chart(self):
        result = self.calculate()
        self.assertEqual(result['julianDayUt'], 2451545.0)
        self.assertEqual(result['ephemeris'], 'moshier')
        self.assertEqual(len(result['bodies']), 10)
        self.assertEqual(len(result['houses']), 12)
        self.assertEqual(len({b['id'] for b in result['bodies']}), 10)
        for body in result['bodies']:
            self.assertTrue(0 <= body['longitude'] < 360)
            self.assertTrue(math.isfinite(body['speed']))
        sun = next(b for b in result['bodies'] if b['id'] == 'sun')
        moon = next(b for b in result['bodies'] if b['id'] == 'moon')
        self.assertAlmostEqual(sun['longitude'], 280.3689, delta=0.001)
        self.assertAlmostEqual(moon['longitude'], 223.3238, delta=0.001)

    def test_fractional_offset_crosses_year_correctly(self):
        actual = self.calculate(date='2000-01-01', time='01:15', utcOffsetMinutes=345)
        expected = self.calculate(date='1999-12-31', time='19:30', utcOffsetMinutes=0)
        self.assertEqual(actual['julianDayUt'], expected['julianDayUt'])
        self.assertEqual(actual['bodies'], expected['bodies'])

    def test_sidereal_configuration_does_not_leak(self):
        before = self.calculate()
        sidereal = self.calculate(zodiac='lahiri')
        after = self.calculate()
        self.assertEqual(before['bodies'], after['bodies'])
        difference = (before['bodies'][0]['longitude'] - sidereal['bodies'][0]['longitude']) % 360
        self.assertTrue(23 < difference < 25)

    def test_all_supported_house_systems_have_twelve_cusps(self):
        for system in ['P', 'K', 'E', 'W']:
            result = self.calculate(houseSystem=system)
            self.assertEqual(len(result['houses']), 12)
            self.assertEqual(result['input']['houseSystem'], system)

    def test_polar_placidus_is_an_error_instead_of_a_fallback(self):
        with self.assertRaises(ValueError):
            self.calculate(latitude=89)

    def test_boundaries_reject_invalid_values(self):
        for patch in [
            {'date': '1900-02-29'}, {'date': '2001-04-31'}, {'date': '1599-12-31'},
            {'time': '24:00'}, {'latitude': float('nan')}, {'latitude': 90},
            {'utcOffsetMinutes': True}, {'utcOffsetMinutes': 841},
            {'houseSystem': 'G'}, {'zodiac': 'bad'}, {'extra': 'unexpected'},
        ]:
            with self.subTest(patch=patch), self.assertRaises(ValueError):
                self.calculate(**patch)

    def test_distance_uses_the_short_arc_across_zero(self):
        self.assertIsNotNone(angular_distance)
        self.assertEqual(angular_distance(359, 1), 2)
        self.assertEqual(angular_distance(10, 190), 180)


if __name__ == '__main__':
    unittest.main()
