const _ = require("lodash");
const moment = require("moment");
const fetch = require("node-fetch");

const { GraphQLJSON, GraphQLJSONObject } = require("graphql-type-json");
//const GraphQLDecimal =require('graphql-type-decimal');
const Users = require("./data/users");
const Authors = require("./data/authors");
const Posts = require("./data/posts");

let {
  GraphQLString,
  GraphQLList,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLFloat,
  GraphQLFieldMap,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLInputObjectType,
} = require("graphql");

const {
  getRefObj,
  createQuery,
  createQueryTabular,
  createQueryCat,
} = require("./schFunk");
//const { errorName } = require("../constants");
const { Cookie } = require("express-session");

const docSync = async () => {
  const dbf = require("./db");
  const couch = dbf.couch.use("otk_2_doc");

  const res = await dbf.querySync(
    "select doc_ver from couchconfig where id=1",
    []
  );
  var seq;
  const doc_ver = res.rows[0].doc_ver;
  console.log("doc sync from seq:" + doc_ver);
  couch.changesReader
    .start({ since: doc_ver, includeDocs: true, wait: true })
    .on("batch", async (b) => {
      b.map(async (rec) => {
        if (!rec.doc || !rec.doc._id || !rec.doc.class_name ) return;
        var ref = rec.doc._id.split("|")[1];
        var dateF = new Date("0001-01-01T00:00:00");
        try {
          dateF = new Date(rec.doc.date); // console.log(rec.doc)
        } catch (e) {
          console.log(
            "Ошибка конвертации даты в документе:" + JSON.stringify(rec.doc)
          );
        }

        await dbf.querySync(
          "INSERT INTO doc" +
            " (id,class_name,ref,jsb,date,branch) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) do " +
            "UPDATE SET class_name = EXCLUDED.class_name,ref=EXCLUDED.ref,jsb=EXCLUDED.jsb,date=EXCLUDED.date,branch=EXCLUDED.branch",
          [
            rec.doc._id,
            rec.doc.class_name,
            ref,
            rec.doc,
            dateF,
            rec.doc.department,
          ],
          (err, res) => {
            if (err) {
              console.log(err);
            }
            seq = rec.seq;
          }
        );
      });
      const f_name = "doc_ver";
      if (seq)
        await dbf.querySync(
          "UPDATE couchconfig SET doc_ver ='" + seq + "' where id=1",
          [],
          (err, res) => {
            if (err) {
              console.log(err);
            }
          }
        );
      couch.changesReader.resume();
    })
    .on("error", (e) => {
      console.log("Error::", e);
    });
};

const catSync = async () => {
  const dbf = require("./db");
  const couch = dbf.couch.use("otk_2_ram");
  const res = await dbf.querySync(
    "select cat_ver from couchconfig where id=1",
    []
  );
  var seq;
  const rev = res.rows[0].cat_ver;
  console.log("cat from seq:" + rev);
  couch.changesReader
    .start({ since: rev, includeDocs: true })
    .on("batch", (b) => {
      b.map((rec) => {
        if (!rec.doc._id || !rec.doc.class_name) return;
        var ref = rec.doc._id.split("|")[1];
        dbf.querySync(
          "INSERT INTO cat" +
            " (id,class_name,ref,jsb) VALUES($1,$2,$3,$4) ON CONFLICT (id) do " +
            "UPDATE SET class_name = EXCLUDED.class_name,ref=EXCLUDED.ref,jsb=EXCLUDED.jsb",
          [rec.doc._id, rec.doc.class_name, ref, rec.doc],
          (err, res) => {
            if (err) {
              console.log(err);
            }
            seq = rec.seq;
          }
        );
      });
      if (seq)
        dbf.querySync(
          "UPDATE couchconfig SET cat_ver='" + seq + "' where id=1",
          [],
          (err, res) => {
            if (err) {
              console.log(err);
            }
          }
        );
    })
    .on("error", (e) => {
      console.log("Error::", e);
    });
};

const PartnerType = new GraphQLObjectType({
  name: "Partner",
  description: "This represent Partner",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.partners",
    },
  },
  fields: () => {
    //const {getRefObj} = require('./schFunk');
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          _ref = getRefObj(obj);
          return _ref ? _ref : null;
        },
      },
      name: { type: GraphQLString },
      edrpou: { type: GraphQLString },
      totalcount:{ type: GraphQLInt },
    };
  },
});
const UserType = new GraphQLObjectType({
  name: "User",
  description: "This represent User",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.users",
    },
  },
  fields: () => {
    //const {getRefObj} = require('./schFunk');
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          _ref = getRefObj(obj);
          return _ref ? _ref : null;
        },
      },
      name: { type: GraphQLString },
      id: { type: GraphQLString },
    };
  },
});
const DeprtmentType = new GraphQLObjectType({
  name: "Depatment",
  description: "This represent Department",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.branches",
    },
  },
  fields: () => {
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          return getRefObj(obj);
        },
      },
      name: { type: GraphQLString },
    };
  },
});

const NomType = new GraphQLObjectType({
  name: "Nom",
  description: "This represent Nomenclature",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.nom",
    },
  },
  fields: () => {
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          return getRefObj(obj);
        },
      },
      name: { type: GraphQLString },
      name_full: { type: GraphQLString },
    };
  },
});

const OrganizationType = new GraphQLObjectType({
  name: "Organisation",
  description: "This represent Organization",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.organizations",
    },
  },
  fields: () => {
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          return getRefObj(obj);
        },
      },
      name: { type: GraphQLString },
    };
  },
});

const ServiceLineBuyersOrderType = new GraphQLObjectType({
  name: "ServiceLineBuyerOrder",
  description: "This represent ServiceLineBuyerOrder",
  fields: () => {
    return {
      row: { type: GraphQLInt },
      nom: { type: NomType },
      content: { type: GraphQLString },
      price: { type: GraphQLFloat },
      quantity: { type: GraphQLFloat },
      amount: { type: GraphQLFloat },
      discount_percent: { type: GraphQLFloat },
      discount_percent_automatic: { type: GraphQLFloat },
      gos_code: { type: GraphQLString },
      vin_code: { type: GraphQLString },
      vat_rate: { type: GraphQLString },
      vat_amount: { type: GraphQLFloat },
    };
  },
});

const BuyersOrderType = new GraphQLObjectType({
  name: "BuyersOrder",
  description: "This represent Buyers Order",
  args: {
    ref: {
      type: GraphQLString,
    },
  },
  fields: () => ({
    _id: { type: GraphQLString },
    organization: { type: OrganizationType },
    doc_amount: { type: GraphQLFloat },
    number_doc: { type: GraphQLString },
    date: { type: GraphQLString },
    partner: { type: PartnerType },
    department: { type: DeprtmentType },
    ClientPerson: { type: GraphQLString },
    ClientPersonPhone: { type: GraphQLString },
    responsible:{type:UserType},
    note: { type: GraphQLString },

    totalcount:{ type: GraphQLInt },
    services: {
      type: new GraphQLList(ServiceLineBuyersOrderType),
      resolve: async (obj, arg, cont, info) => {
        var qq = createQueryTabular(
          obj,
          info,
          "services",
          "buyers_order",
          ServiceLineBuyersOrderType,
          10
        );
        const dbf = require("./db");
        res = await dbf.query(qq, []);
        return res.rows.map((e) => {
          return e.jsb;
        });
      },
    },
  }),
}); 

const AuthorType = new GraphQLObjectType({
  name: "Author",
  description: "This represent an author",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    twitterHandler: { type: GraphQLString },
  }),
});

const PostType = new GraphQLObjectType({
  name: "s",
  description: "This represent a s",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    body: { type: GraphQLString },
    category: { type: GraphQLString },
    author: {
      type: AuthorType,
      resolve: function (post) {
        return _.find(Authors, (a) => a.id == post.author_id);
      },
    },
  }),
});

const filtType = new GraphQLInputObjectType({
  name: "filter",
  fields: {
    field: { type: GraphQLString },
    expr: { type: GraphQLString },
    value: { type: GraphQLString },
  },
});

const sortType = new GraphQLInputObjectType({
  name: "sort",
  fields: {
    selector: { type: GraphQLString },
    desc: { type: GraphQLString },
  },
});

const BlogQueryRootType = new GraphQLObjectType({
  name: "BlogAppSchema",
  description: "Blog Application Schema Query Root",
  fields: {
    authors: {
      type: new GraphQLList(AuthorType),
      description: "List of all Authors",
      resolve: function () {
        return Authors;
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      description: "List of all Posts",
      resolve: function () {
        return Posts;
      },
    },
    buyers_orders: {
      name: "buyers_order",
      type: new GraphQLList(BuyersOrderType),
      args: {
        ref: {
          type: GraphQLString,
        },
        limit: {
          type: GraphQLInt,
        },
        offset: {
          type: GraphQLInt,
        },
        lookup: { type: GraphQLString },
        nameContaine: { type: GraphQLString },
        filter: {
          type: new GraphQLList(filtType),
        },
        jfilt: {
          type: new GraphQLList(GraphQLJSON),
        },

        sort: {type: sortType,},
        totalCount: { type: GraphQLInt },
      },
      resolve: async function (par, args, cont, info) {
        console.log("currUser:", cont.currUser);
        console.log('=Args:',args);
        if (!cont.currUser) return new Error("AUTH_ERROR");
        var queryOptions = { 
          currUser: cont.currUser, 
          lookup: args.lookup,
          limit: args.limit?args.limit:undefined,
          totalCount: args.totalCount?args.totalCount:undefined,

        };
        console.log("queryOptions:", queryOptions);
        var qq = createQuery(
          args,
          info,
          "buyers_order",
          BuyersOrderType,
          queryOptions
        );

        const dbf = require("./db");
        res = await dbf.query(qq, []);
        if (!args.totalCount){
          return res.rows.map((e) => {
              return e.jsb;
          });
        }    
        return res.rows
      
      },
    },
    partners: {
      name: "partners",
      type: new GraphQLList(PartnerType),
      args: {
        ref: {
          type: GraphQLString,
        },
        limit: {
          type: GraphQLInt,
        },
        offset: {
          type: GraphQLInt,
        },
        lookup: { type: GraphQLString },
        nameContaine: { type: GraphQLString },
        name: { type: GraphQLString },
        edrpou: { type: GraphQLString },
        filter: {
          type: new GraphQLList(filtType),
        },
        totalCount: { type: GraphQLInt },
        js: { type: GraphQLJSON },
      },
      resolve: async function (par, args, cont, info) {
       
        var qq = createQueryCat(args, info, "partners", PartnerType, {
          lookup: args.lookup,
          nameContaine: args.nameContaine,
          limit: args.limit?args.limit:undefined,
          totalCount: args.totalCount?args.totalCount:undefined,
        });
        const dbf = require("./db");
        //console.log(qq);
        res = await dbf.query(qq, []);
        //console.log(res);
        if (!args.totalCount){
            return res.rows.map((e) => {
                return e.jsb;
            });
          }    
          return res.rows
        }
    },
    noms: {
      name: "noms",
      type: new GraphQLList(NomType),
      args: {
        ref: {
          type: GraphQLString,
        },
        limit: {
          type: GraphQLInt,
        },
        offset: {
          type: GraphQLInt,
        },
        lookup: { type: GraphQLString },
        nameContaine: { type: GraphQLString },
        name: { type: GraphQLString },
        edrpou: { type: GraphQLString },
        filter: {
          type: new GraphQLList(filtType),
        },
        skip: { type: GraphQLInt },
        js: { type: GraphQLJSON },
      },
      resolve: async function (par, args, cont, info) {
        console.log(args);
        var qq = createQueryCat(args, info, "nom", NomType, {
          lookup: args.lookup,
          nameContaine: args.nameContaine,
          limit: 50,
        });
        const dbf = require("./db");
        console.log(qq);
        res = await dbf.query(qq, []);
        return res.rows.map((e) => {
          return e.jsb;
        });
      },
    },
    branch: {
      name: "branch",
      type: GraphQLJSONObject,
      args: {
        ref: {
          type: GraphQLString,
        },
      },
      //   limit: {
      //     type: GraphQLInt,
      //   },
      //   offset: {
      //     type: GraphQLInt,
      //   },
      //   lookup: { type: GraphQLString },
      //   nameContaine:{type : GraphQLString},
      //   name: {type: GraphQLString} ,
      //   edrpou: {type: GraphQLString} ,
      //   filter:{
      //     type: new GraphQLList(filtType)
      //       },
      //       skip:{type:GraphQLInt},
      //       js:{type:GraphQLJSON},

      // },
      resolve: async function (par, args, cont, info) {
        //args.ref = cont.currUser.token
        console.log(args);

        var qq = createQueryCat(args, info, "branches", undefined, {
          limit: 1,
        });
        const dbf = require("./db");
        //console.log('pg_query:',qq);
        res = await dbf.query(qq, []);
        //console.log('pg_res:',res);

        if (res.rowCount > 0) return res.rows[0];
        else {
        }
      },
    },
    tst: {
      name: "fff",
      type: GraphQLString,
      args: {
        id: {
          type: GraphQLString,
        },
      },
      resolve: async (obj, args) => {
        console.log(obj, args);
        docSync();
        catSync();
        return "this  test 2";
      },
    },

    logout: {
      name: "logout",
      type: GraphQLJSON,
      resolve: async (obj, args, context) => {
        // if (!context.currUser) return {}
        if (context.currUser.token) {
          Users = _.remove(Users, function (n) {
            return n.token === context.currUser.token;
          });
        }
        return {};
      },
    },
    auth: {
      name: "auth",
      type: GraphQLJSON,
      args: {
        name: { type: GraphQLString },
        pass: { type: GraphQLString },
      },
      resolve: async (obj, args, context) => {
        console.log("Auth", obj, args);

        const sendData = {
          name: args.name,
          password: args.pass,
        };
        const POSTrequestOptions = {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: "",
        };

        POSTrequestOptions.body = JSON.stringify(sendData);

        console.log(Users);

        res = await fetch(
          "https://couch.vioo.com.ua" + "/_session",
          POSTrequestOptions
        )
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              return { ok: false };
            }
          })
          .then((data) => {
            if (!data.ok) return data;
            console.log("=login respons=:" + JSON.stringify(data));
            var user = Users.find((obj) => {
              return obj.name === data.name;
            });
            console.log("=user from tale=:", user);
            var branch = "";
            var ref = "";
            var isAdmin = false;
            data.roles.forEach((r) => {
              var opt = r.split(":");
              if (opt[0] === "branch") branch = opt[1];
              else if (opt[0] === "ref") ref = opt[1];
              else if (opt[0] === "_admin") isAdmin = true;
            });

            //context.res.cookie('token', data.token, {httpOnly:false,  'httpOnly': false, SameSite:false,})
            if (!user) {
              token =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
              data.token = token;
              Users.push({
                ref: ref,
                name: data.name,
                isAdmin: isAdmin,
                branch: branch,
                token: data.token,
                validTo: moment().add(3, "hours"),
              });
            } else {
              token = user.token;
            }
            context.res.setHeader("Set-Cookie", [
              `token=${token};  Path=/; Max-age= 3600;SameSite=false;`,
            ]);
            return data;
          })
          .catch((error) => console.log("=Error=:" + error));
        if (res.ok) return { ok: res.ok, name: res.name, token: res.token };
        else return new Error("AUTH_ERROR");
      },
    },
  },
});

const BlogMutationRootType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    setBuyersOrder: {
      type: BuyersOrderType,
      args: { 
        input: { 
          type: GraphQLJSONObject
        } 
      },

      resolve: async (source, args,context) => {
        //console.log("Source: ", source, "\n Args: ", args);
        //console.log("currUser:", context.currUser);
        if (!context.currUser) return new Error("AUTH_ERROR");

        var qq = `SELECT d.jsb jsb FROM doc d  where d.id='${args.input._id}'`
        //console.log('Query:',qq)
        const dbf = require("./db");
        var resQ = await dbf.query(qq, []);
        //+++
        //console.log('ResQ:',resQ )
        var resDoc = _.merge(resQ.rows[0].jsb,args.input)
        //console.log ('resDoc:', JSON.stringify(resDoc))
        
        const couch = dbf.couch.use("otk_2_doc");
        dbf.query(`UPDATE doc SET jsb='${JSON.stringify(resDoc)}', date=${new Date(resDoc.date)} WHERE id=${resDoc._id} `, []);
        await couch.insert(resDoc).then((body) => {}  )
      
        return {_id:"ok"}
      },
    }, 
  },
});
const BlogAppSchema = new GraphQLSchema({
  query: BlogQueryRootType,
  mutation: BlogMutationRootType,
});

module.exports = BlogAppSchema;
