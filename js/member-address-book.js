/* 会员详情与客户端共用的原型收货地址簿，按会员 ID 存储。 */
(function (global) {
  'use strict';

  var DEMO_MEMBER_ID = 'UC10001';
  var ADDRESS_LABEL_TAGS = { 家: true, 公司: true, 父母: true, 学校: true, 其他: true };
  var ADDRESS_BOOK_GROUPS = [
    {
      id: 'ab-g1',
      name: '林晓棠',
      phone: '13856781234',
      phoneDisplay: '138 5678 1234',
      addresses: [
        {
          id: 'ab-a1',
          text: '浙江省杭州市西湖区文三路 西溪花园3幢2单元501室',
          isDefault: true
        },
        {
          id: 'ab-a2',
          text: '浙江省杭州市余杭区仓前街道 梦想小镇创业大街12号',
          isDefault: false
        }
      ]
    },
    {
      id: 'ab-g2',
      name: '周启明',
      phone: '15022338866',
      phoneDisplay: '150 2233 8866',
      addresses: [
        {
          id: 'ab-a3',
          text: '浙江省杭州市滨江区网商路 阿里中心4号楼',
          isDefault: false
        },
        {
          id: 'ab-a4',
          text: '浙江省杭州市拱墅区莫干山路 远洋国际中心B座',
          isDefault: false
        },
        {
          id: 'ab-a5',
          text: '浙江省宁波市鄞州区中山东路 和丰创意广场',
          isDefault: false
        },
        {
          id: 'ab-a6',
          text: '浙江省嘉兴市南湖区中环南路 科技城孵化园',
          isDefault: false
        }
      ]
    },
    {
      id: 'ab-g3',
      name: '何雨桐',
      phone: '18699881200',
      phoneDisplay: '186 9988 1200',
      addresses: [
        {
          id: 'ab-a7',
          text: '浙江省绍兴市越城区解放南路 镜湖新区公馆',
          isDefault: false
        }
      ]
    }
  ];

  function activeMemberId() {
    try {
      return localStorage.getItem('ua_active_member_id_v1') || DEMO_MEMBER_ID;
    } catch (e) {
      return DEMO_MEMBER_ID;
    }
  }

  function key(memberId) {
    return 'lf_member_address_book_v1:' + memberId;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function addressIsDefault(address) {
    return !!(address && address.isDefault);
  }

  /** 分组是否含默认地址（兼容旧版 group.isDefault 展示）。 */
  function groupHasDefault(group) {
    if (!group) return false;
    if ((group.addresses || []).some(addressIsDefault)) return true;
    return !!group.isDefault;
  }

  /** 去掉家/公司等地址标签；默认标记落到单条地址上。 */
  function normalizeGroup(group) {
    var tags = Array.isArray(group && group.tags) ? group.tags : [];
    var groupDefault =
      group && Object.prototype.hasOwnProperty.call(group, 'isDefault')
        ? !!group.isDefault
        : tags.indexOf('默认') >= 0;
    var addresses = Array.isArray(group && group.addresses) ? group.addresses : [];
    var hasAddressDefault = addresses.some(function (address) {
      return Object.prototype.hasOwnProperty.call(address || {}, 'isDefault') && !!address.isDefault;
    });
    var nextAddresses = addresses.map(function (address, index) {
      var next = Object.assign({}, address || {});
      if (Object.prototype.hasOwnProperty.call(next, 'isDefault')) {
        next.isDefault = !!next.isDefault;
      } else if (groupDefault && !hasAddressDefault && index === 0) {
        /* 旧数据仅在分组上标记默认时，迁到该组第一条地址 */
        next.isDefault = true;
      } else {
        next.isDefault = false;
      }
      return next;
    });
    var next = Object.assign({}, group || {}, {
      addresses: nextAddresses
    });
    delete next.tags;
    delete next.isDefault;
    return next;
  }

  /** 全地址簿仅允许一条默认收货地址。 */
  function ensureSingleDefault(groups) {
    var seen = false;
    return (groups || []).map(function (group) {
      return Object.assign({}, group, {
        addresses: (group.addresses || []).map(function (address) {
          if (!address.isDefault) return address;
          if (seen) return Object.assign({}, address, { isDefault: false });
          seen = true;
          return Object.assign({}, address, { isDefault: true });
        })
      });
    });
  }

  function normalizeGroups(groups) {
    return ensureSingleDefault((groups || []).map(normalizeGroup));
  }

  function setDefault(groups, addressId, enabled) {
    return (groups || []).map(function (group) {
      return Object.assign({}, group, {
        addresses: (group.addresses || []).map(function (address) {
          if (enabled) {
            return Object.assign({}, address, { isDefault: address.id === addressId });
          }
          if (address.id !== addressId) return address;
          return Object.assign({}, address, { isDefault: false });
        })
      });
    });
  }

  function load(memberId) {
    if (!memberId) return [];
    try {
      var stored = JSON.parse(localStorage.getItem(key(memberId)));
      if (Array.isArray(stored)) return normalizeGroups(stored);
      if (memberId === DEMO_MEMBER_ID) {
        var legacy = JSON.parse(sessionStorage.getItem('ua_refund_address_book'));
        if (Array.isArray(legacy)) return normalizeGroups(legacy);
      }
    } catch (e) {
      // Fall back to the member's initial address book.
    }
    return memberId === DEMO_MEMBER_ID ? normalizeGroups(clone(ADDRESS_BOOK_GROUPS)) : [];
  }

  function save(memberId, groups) {
    if (!memberId) return;
    localStorage.setItem(key(memberId), JSON.stringify(normalizeGroups(groups)));
  }

  function addressParts(address) {
    if (address.region && address.detail) {
      return { region: address.region.split(/\s*\/\s*|\s+/).join(' / '), detail: address.detail };
    }
    var raw = String(address.text || '').trim();
    var match = raw.match(/^(?:(.+?(?:省|自治区))\s*)?(.+?市)\s*([^区县]+[区县])\s*(.*)$/);
    if (!match) return { region: '', detail: raw };
    var region = match[1] ? [match[1], match[2], match[3]] : [match[2], '市辖区', match[3]];
    return { region: region.join(' / '), detail: match[4] };
  }

  function addressText(region, detail) {
    return (
      region
        .split(/\s*\/\s*|\s+/)
        .filter(function (part) {
          return part && part !== '市辖区';
        })
        .join('') +
      ' ' +
      detail
    );
  }

  global.MemberAddressBook = {
    activeMemberId: activeMemberId,
    key: key,
    load: load,
    save: save,
    addressParts: addressParts,
    addressText: addressText,
    normalizeGroups: normalizeGroups,
    setDefault: setDefault,
    groupHasDefault: groupHasDefault,
    isAddressLabelTag: function (tag) {
      return !!ADDRESS_LABEL_TAGS[String(tag || '')];
    }
  };
})(window);
