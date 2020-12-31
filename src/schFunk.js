const getRefObj = (obj) => {
  if (!obj._id) {
    return null;
  }
  return obj._id.split("|")[1];
};

const _blanc = () => {
  return null;
};

const createQuery = (args, info, class_name, type, queryOptions = {}) => {
  if (queryOptions.limit) limit = queryOptions.limit;

  var setF = new Set();
  info.fieldNodes[0].selectionSet.selections.map((e) => {
    //console.log('===Selection set:',e)
    var _fields = type; //BuyersOrderType
    var _field = _fields.getFields()[e.name.value];
    if (_field.type.extensions && _field.type.extensions.otk)
      setF.add({ field: e.name.value, ext: _field.type.extensions.otk });
    return e.name.value;
  });
  strSel = strJoin = "";
  setF.forEach((f) => {
    //console.log()
    strSel =
      strSel + "||JSONB_BUILD_OBJECT('" + f.field + "',a_" + f.field + ".jsb)";
    strJoin =
      strJoin +
      " LEFT JOIN " +
      f.ext.tbl +
      " a_" +
      f.field +
      " on ((d.jsb->>'" +
      f.field +
      "')= a_" +
      f.field +
      "." +
      f.ext.keyF +
      " and a_" +
      f.field +
      ".jsb->>'class_name'='" +
      f.ext.class_name +
      "')";
  });

  var filt = "";
  if (args.filter)
    args.filter.forEach((f_el) => {
      filt += ` and d.jsb->>'${f_el.field}' ilike '%${f_el.value}%' `;
    });

  function createFilt(f) {
    const checkParams = (_fld, _expr, val) => {
      //console.log("_fld:", _fld);
      let fld = "";
      switch (_fld) {
        case "date":
          fld = `d.${_fld}`;
          break;
        default:
          fld = `d.jsb->>'${_fld}'`;
      }
      switch (_expr) {
        case "contains":
          return [fld, "ilike", `'%${val}%'`];
        case "starstwith":
          return [fld, "ilike", `'${val}%'`];
        case "endstwith":
          return [fld, "ilike", `'%${val}'`];
        default:
          return [fld, `${_expr}`, `'${val}'`];
      }
    };

    var jf = "(";
    // console.log("=f=:", f, " -is Array:", Array.isArray(f));
    f.forEach((f_el) => {
      // console.log("f_el:", f_el);
      if (Array.isArray(f_el)) {
        jf += createFilt(f_el);
      } else {
        if (f_el.c) jf += " " + f_el.c + " ";
        else {
          [fld, expr, val] = checkParams(f_el.fld, f_el.expr, f_el.val);

          jf += `${fld} ${expr} ${val} `;
        }
      }
    });
    return jf + ")";
  }

  var jfilt = "";
  if (args.jfilt) jfilt = " and " + createFilt(args.jfilt);

  //console.log("_jfilt:", jfilt);

  if (args) {
    if (args.ref) {
        filt += " and  d.ref='" + args.ref + "' ";
        jfilt += " and  d.ref='" + args.ref + "' ";
    }
    if (args.limit) limit = args.limit;
  }

  var branch = "";
  if (queryOptions.currUser && !queryOptions.currUser.isAdmin)
    branch = ` and  d.branch='${queryOptions.currUser.branch}' `;

  var qq = `SELECT d.jsb ${strSel} jsb, d.jsb->>'date' date FROM doc d ${strJoin} where  not d.jsb?'_deleted' and d.jsb->>'class_name'= 'doc.${class_name}' ${jfilt}${branch}`;
  if (args.sort)
    qq += ` ORDER BY d.jsb->>'${args.sort.selector}' ${
      args.sort.desc === "false" ? "" : "desc"
    } `;
  else qq += ` ORDER BY d.date desc `;

  if (limit) qq += " LIMIT " + limit;
  if (args.offset) qq += " OFFSET " + args.offset;
  //console.log(args)
  var qqTotalCount = `SELECT count(ref) totalcount FROM doc d  WHERE not d.jsb?'_deleted' and d.jsb->>'class_name'= 'doc.${class_name}' ${jfilt}${branch}`;
  if (queryOptions.totalCount) qq = qqTotalCount;

  console.log(qq);
  return qq;
};
const createQueryOptions = {
  lookup: undefined,
};

const createQueryCat = (
  args,
  info,
  class_name,
  type,
  createQueryOptions = {}
) => {
  var setF = new Set();
  if (type)
    info.fieldNodes[0].selectionSet.selections.map((e) => {
      var _fields = type;
      var _field = _fields.getFields()[e.name.value];
      if (_field.type.extensions && _field.type.extensions.otk)
        setF.add({ field: e.name.value, ext: _field.type.extensions.otk });
      return e.name.value;
    });
  //console.log('fields to resolve:',setF)
  strSel = strJoin = "";
  setF.forEach((f) => {
    //console.log()
    strSel =
      strSel + "||JSONB_BUILD_OBJECT('" + f.field + "',a_" + f.field + ".jsb)";
    strJoin =
      strJoin +
      " LEFT JOIN " +
      f.ext.tbl +
      " a_" +
      f.field +
      " on ((d.jsb->>'" +
      f.field +
      "')= a_" +
      f.field +
      "." +
      f.ext.keyF +
      " and a_" +
      f.field +
      ".jsb->>'class_name'='" +
      f.ext.class_name +
      "')";
  });
  // console.log(strSel)
  // console.log(strJoin)
  var filt = "";
  if (createQueryOptions.limit) limit = createQueryOptions.limit;
  if (args) {
    if (args.ref) {
      filt = filt + " and  d.ref='" + args.ref + "' ";
    }
    if (args.limit) limit = args.limit;
  }

  if (args.filter)
    args.filter.forEach((f_el) => {
      filt += ` and d.jsb->>'${f_el.field}' ilike '%${f_el.value}%' `;
    });

  var qq = "";

  _offset = "";
  if (args.offset) {
    _offset = args.offset;
  }

  //console.log("o:", createQueryOptions);
  if (createQueryOptions.lookup) {
    qq =
      "SELECT d.jsb" +
      strSel +
      " jsb, 0 orderU,d.jsb->>'name' jname FROM cat d " +
      strJoin +
      " where d.jsb->>'class_name'= 'cat." +
      class_name +
      "' and d.ref = '" +
      createQueryOptions.lookup.trim() +
      "' UNION ";
    //  filt = " and d.jsb->>'name' LiKE '%КОПАЙ%' "
  }
  qq +=
    " SELECT s.jsb,s.orderU,s.jsb->>'name' jname from (SELECT d.jsb" +
    strSel +
    " jsb, 1 orderU FROM cat d " +
    strJoin +
    " WHERE d.jsb->>'class_name'= 'cat." +
    class_name +
    "'" +
    filt;
  var qqTotalCount =
    "SELECT count(ref) totalcount FROM cat d  WHERE d.jsb->>'class_name'= 'cat." +
    class_name +
    "'" +
    filt;
  // if (createQueryOptions.nameContaine)
  //     qq += " and d.jsb->>'name' ILIKE '%"+createQueryOptions.nameContaine+"%' "
  if (createQueryOptions.nameContaine)
    qq +=
      " and d.jsb->>'name' ILIKE '%" + createQueryOptions.nameContaine + "%' ";
  //        qq += " ) s"
  //    qq += " ORDER BY orderU, jname"
  //    if (limit) qq +=  " LIMIT "+limit
  //    if (_offset) qq +=  " OFFSET "+_offset
  //---
  qq += " ORDER BY orderU, d.jsb->>'name'";
  if (limit) qq += " LIMIT " + limit;
  if (_offset) qq += " OFFSET " + _offset;
  qq += " ) s";
  qq += " ORDER BY orderU, jname";

  //console.log(args)
  //console.log(qq)
  if (createQueryOptions.totalCount) return qqTotalCount;
  return qq;
};

const createQueryTabular = (
  par,
  info,
  tabular,
  class_name,
  type,
  limit = undefined
) => {
  var setF = new Set();

  info.fieldNodes[0].selectionSet.selections.map((e) => {
    var _fields = type; //BuyersOrderType
    var _field = _fields.getFields()[e.name.value];
    //console.log('_field:',info.fieldNodes[0].selectionSet.selections)
    if (_field.type.extensions && _field.type.extensions.otk) {
      //console.log('e:',e)
      setF.add({ field: e.name.value, ext: _field.type.extensions.otk });
    }
    return e.name.value;
  });
  // console.log('fields to resolve:',setF)
  strSel = strJoin = "";
  setF.forEach((f) => {
    // console.log(f)
    strSel =
      strSel + "||JSONB_BUILD_OBJECT('" + f.field + "',a_" + f.field + ".jsb)";
    strJoin =
      strJoin +
      " LEFT JOIN " +
      f.ext.tbl +
      " a_" +
      f.field +
      " on ((r.jsb->>'" +
      f.field +
      "')= a_" +
      f.field +
      "." +
      f.ext.keyF +
      " and a_" +
      f.field +
      ".jsb->>'class_name'='" +
      f.ext.class_name +
      "')";
  });
  // console.log(strSel)
  // console.log(strJoin)

  var qq =
    "SELECT r.jsb" +
    strSel +
    " jsb FROM (select jsonb_array_elements(d.jsb->'" +
    tabular +
    "') jsb from doc d where d.jsb->>'class_name'= 'doc." +
    class_name +
    "' and d.id = '" +
    par._id +
    "' ) r" +
    strJoin;
  if (limit) qq = qq + " LIMIT " + limit;
  // console.log(qq)
  return qq;
};

module.exports = {
  getRefObj: getRefObj,
  _blanc: _blanc,
  createQuery: createQuery,
  createQueryTabular: createQueryTabular,
  createQueryCat: createQueryCat,
};
