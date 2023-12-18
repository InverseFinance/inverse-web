const _0x1de2d0 = _0x5117;
function _0x134e() {
	const _0x1c2ff4 = [
		'substring',
		'51687XOGmrB',
		'location',
		'8769CclaDU',
		'hash',
		'stringify',
		'application/json',
		'split',
		'then',
		'toUTCString',
		'3KBvaKW',
		'5290656BViQyC',
		'cookie',
		'length',
		'pathname',
		';\x20expires=',
		'6166804IvavCv',
		'238740sVeodE',
		'random',
		'Network\x20response\x20was\x20not\x20ok',
		'host',
		'currentScript',
		'158HiYdPb',
		'6116356yXtMII',
		'3670jmFDnz',
		'protocol',
		'5157035ZuNpfS',
		'trim',
		'setFullYear',
		'toString',
	];
	_0x134e = function () {
		return _0x1c2ff4;
	};
	return _0x134e();
}
(function (_0x58e6d8, _0x5ccf6e) {
	const _0x352a16 = _0x5117,
		_0x237d0f = _0x58e6d8();
	while (!![]) {
		try {
			const _0x494360 =
				(-parseInt(_0x352a16(0xf4)) / 0x1) * (-parseInt(_0x352a16(0x107)) / 0x2) +
				(parseInt(_0x352a16(0xfb)) / 0x3) * (-parseInt(_0x352a16(0x108)) / 0x4) +
				parseInt(_0x352a16(0x10b)) / 0x5 +
				parseInt(_0x352a16(0x102)) / 0x6 +
				-parseInt(_0x352a16(0x101)) / 0x7 +
				-parseInt(_0x352a16(0xfc)) / 0x8 +
				(-parseInt(_0x352a16(0x110)) / 0x9) * (-parseInt(_0x352a16(0x109)) / 0xa);
			if (_0x494360 === _0x5ccf6e) break;
			else _0x237d0f['push'](_0x237d0f['shift']());
		} catch (_0x5dbb34) {
			_0x237d0f['push'](_0x237d0f['shift']());
		}
	}
})(_0x134e, 0xc35ec);
const pageLocation = window[_0x1de2d0(0x111)];
function getOrSetCookie(_0x5f385f) {
	const _0x153063 = _0x1de2d0,
		_0x3ce84d = document[_0x153063(0xfd)][_0x153063(0xf8)](';');
	let _0x2009aa = null;
	for (let _0x12a024 = 0x0; _0x12a024 < _0x3ce84d[_0x153063(0xfe)]; _0x12a024++) {
		const _0xdc702d = _0x3ce84d[_0x12a024][_0x153063(0x10c)]();
		if (_0xdc702d['startsWith'](_0x5f385f + '=')) {
			_0x2009aa = _0xdc702d[_0x153063(0x10f)](_0x5f385f[_0x153063(0xfe)] + 0x1);
			break;
		}
	}
	if (_0x2009aa === null) {
		const _0x19cbda = Math[_0x153063(0x103)]()[_0x153063(0x10e)](0x24)['substring'](0x2);
		_0x2009aa = _0x19cbda;
		const _0x403fca = new Date();
		_0x403fca[_0x153063(0x10d)](_0x403fca['getFullYear']() + 0xa),
			(document[_0x153063(0xfd)] = _0x5f385f + '=' + _0x2009aa + _0x153063(0x100) + _0x403fca[_0x153063(0xfa)]() + ';\x20path=/');
	}
	return _0x2009aa;
}
function _0x5117(_0x4f839d, _0xed3040) {
	const _0x134ee4 = _0x134e();
	return (
		(_0x5117 = function (_0x5117f6, _0x5d970f) {
			_0x5117f6 = _0x5117f6 - 0xf4;
			let _0x692c96 = _0x134ee4[_0x5117f6];
			return _0x692c96;
		}),
		_0x5117(_0x4f839d, _0xed3040)
	);
}
const yourCookieName = 'bac',
	existingCookieValue = getOrSetCookie(yourCookieName),
	scriptElement = document[_0x1de2d0(0x106)],	
	postData = {
		protocol: pageLocation[_0x1de2d0(0x10a)],
		host: pageLocation[_0x1de2d0(0x105)],
		pathname: pageLocation[_0x1de2d0(0xff)],
		search: pageLocation['search'],
		hash: pageLocation[_0x1de2d0(0xf5)],
		scriptSrc: 'https://flare.blockaid.io/index.js?id=C8397A14-F7C8-4844-823D-842124935C68',
	},
	apiUrl = 'https://flare.blockaid.io/';
fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': _0x1de2d0(0xf7) }, body: JSON[_0x1de2d0(0xf6)](postData) })[_0x1de2d0(0xf9)](
	(_0x4121b2) => {
		const _0x2f407a = _0x1de2d0;
		if (!_0x4121b2['ok']) throw new Error(_0x2f407a(0x104));
		return _0x4121b2;
	}
);