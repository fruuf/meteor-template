import sinon from 'sinon';
import { find, findOne, combine, relation, merge, optionalRelation } from '~/imports/util/relation';

describe('util/relation', () => {
  describe('relation', () => {
    it('accepts an id as direct prop', () => {
      const createQuery = relation('_id', 'fooId');
      const props = {
        fooId: 'foo:1',
      };
      const expectedQuery = {
        _id: 'foo:1',
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('accepts array of ids as direct prop', () => {
      const createQuery = relation('_id', 'fooIds');
      const props = {
        fooIds: ['foo:1', 'foo:2'],
      };
      const expectedQuery = {
        _id: { $in: ['foo:1', 'foo:2'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('accepts a document with relationId as prop', () => {
      const createQuery = relation('_id', 'foo', 'barId');
      const props = {
        foo: { _id: 'foo:1', barId: 'bar:1' },
      };
      const expectedQuery = {
        _id: 'bar:1',
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('accepts a document with multiple relationIds as prop', () => {
      const createQuery = relation('_id', 'foo', 'barIds');
      const props = {
        foo: { _id: 'foo:1', barIds: ['bar:1', 'bar:2'] },
      };
      const expectedQuery = {
        _id: { $in: ['bar:1', 'bar:2'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('accepts multiple documents with relationIds as prop', () => {
      const createQuery = relation('_id', 'foos', 'barId');
      const props = {
        foos: [{ _id: 'foo:1', barId: 'bar:1' }, { _id: 'foo:2', barId: 'bar:2' }],
      };
      const expectedQuery = {
        _id: { $in: ['bar:1', 'bar:2'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('accepts multiple documents with multiple relationIds as prop', () => {
      const createQuery = relation('_id', 'foos', 'barIds');
      const props = {
        foos: [{ _id: 'foo:1', barIds: ['bar:1', 'bar:2'] }, { _id: 'foo:2', barIds: ['bar:3', 'bar:4'] }],
      };
      const expectedQuery = {
        _id: { $in: ['bar:1', 'bar:2', 'bar:3', 'bar:4'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns query if some documents are invalid', () => {
      const createQuery = relation('_id', 'foos', 'barId');
      const props = {
        foos: [{ _id: 'foo:1' }, { _id: 'foo:2', barId: 'bar:1' }],
      };
      const expectedQuery = {
        _id: { $in: ['bar:1'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns false if direct prop is undefined', () => {
      const createQuery = relation('_id', 'fooId');
      const props = {}; // no fooId !
      const expectedQuery = false;
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns false if document is undefined', () => {
      const createQuery = relation('_id', 'foo', 'barId');
      const props = {}; // no foo !
      const expectedQuery = false;
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns false if document is invalid', () => {
      const createQuery = relation('_id', 'foo', 'barId');
      const props = { foo: { _id: 'foo:1' } }; // no barId !
      const expectedQuery = false;
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns false if all documents are invalid', () => {
      const createQuery = relation('_id', 'foos', 'barId');
      const props = {
        foos: [{ _id: 'foo:1' }, { _id: 'foo:2' }],
      };
      const expectedQuery = false;
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns false with empty documents array', () => {
      const createQuery = relation('_id', 'foos', 'barId');
      const props = {
        foos: [],
      };
      const expectedQuery = false;
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });
  });

  describe('optionalRelation', () => {
    it('behaves like relation', () => {
      let createQuery = optionalRelation('_id', 'fooId');
      let props = {
        fooId: 'foo:1',
      };
      let expectedQuery = {
        _id: 'foo:1',
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'fooIds');
      props = {
        fooIds: ['foo:1', 'foo:2'],
      };
      expectedQuery = {
        _id: { $in: ['foo:1', 'foo:2'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'foo', 'barId');
      props = {
        foo: { _id: 'foo:1', barId: 'bar:1' },
      };
      expectedQuery = {
        _id: 'bar:1',
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'foo', 'barIds');
      props = {
        foo: { _id: 'foo:1', barIds: ['bar:1', 'bar:2'] },
      };
      expectedQuery = {
        _id: { $in: ['bar:1', 'bar:2'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'foos', 'barId');
      props = {
        foos: [{ _id: 'foo:1', barId: 'bar:1' }, { _id: 'foo:2', barId: 'bar:2' }],
      };
      expectedQuery = {
        _id: { $in: ['bar:1', 'bar:2'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'foos', 'barIds');
      props = {
        foos: [{ _id: 'foo:1', barIds: ['bar:1', 'bar:2'] }, { _id: 'foo:2', barIds: ['bar:3', 'bar:4'] }],
      };
      expectedQuery = {
        _id: { $in: ['bar:1', 'bar:2', 'bar:3', 'bar:4'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'foos', 'barId');
      props = {
        foos: [{ _id: 'foo:1' }, { _id: 'foo:2', barId: 'bar:1' }],
      };
      expectedQuery = {
        _id: { $in: ['bar:1'] },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns empty query', () => {
      let createQuery = optionalRelation('_id', 'fooId');
      let props = {}; // no fooId !
      let expectedQuery = {};
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'foo', 'barId');
      props = {}; // no foo !
      expectedQuery = {};
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'foo', 'barId');
      props = { foo: { _id: 'foo:1' } }; // no barId !
      expectedQuery = {};
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'foos', 'barId');
      props = {
        foos: [{ _id: 'foo:1' }, { _id: 'foo:2' }],
      };
      expectedQuery = {};
      expect(createQuery(props)).to.deep.equal(expectedQuery);

      createQuery = optionalRelation('_id', 'foos', 'barId');
      props = {
        foos: [],
      };
      expectedQuery = {};
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });
  });

  describe('combine', () => {
    it('combines relations', () => {
      const createQuery = combine(
        relation('fooId', 'foo', '_id'),
        relation('barId', 'bar', '_id')
      );
      const props = {
        foo: { _id: 'foo:1' },
        bar: { _id: 'bar:1' },
      };
      const expectedQuery = {
        fooId: 'foo:1',
        barId: 'bar:1',
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('combines relations and query objects', () => {
      const createQuery = combine(
        relation('fooId', 'foo', '_id'),
        { barId: 'bar:1' }
      );
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedQuery = {
        fooId: 'foo:1',
        barId: 'bar:1',
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('accepts any props => query function', () => {
      const createQuery = combine(
        relation('fooId', 'foo', '_id'),
        props => ({ rating: { $gte: props.rating } })
      );
      const props = {
        foo: { _id: 'foo:1' },
        rating: 5,
      };
      const expectedQuery = {
        fooId: 'foo:1',
        rating: { $gte: 5 },
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns false if one relation returns false', () => {
      const createQuery = combine(
        relation('fooId', 'foo', '_id'),
        relation('barId', 'bar', '_id')
      );
      const props = {
        // no bar
        foo: { _id: 'foo:1' },
      };
      const expectedQuery = false;
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns false if string is passed', () => {
      const createQuery = combine(
        relation('fooId', 'foo', '_id'),
        'bar:2'
      );
      const props = {
        // no bar
        foo: { _id: 'foo:1' },
      };
      const expectedQuery = false;
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('throws on conflict', () => {
      const createQuery = combine(
        relation('fooId', 'foo', '_id'),
        relation('fooId', 'bar', 'fooId')
      );
      const props = {
        foo: { _id: 'foo:1' },
        bar: { _id: 'bar:1', fooId: 'foo:1' },
      };
      expect(() => createQuery(props)).to.throw(/conflict/);
    });

    it('throws on conflict with query objects', () => {
      const createQuery = combine(
        relation('fooId', 'foo', '_id'),
        { fooId: 'foo:2' }
      );
      const props = {
        foo: { _id: 'foo:1' },
      };
      expect(() => createQuery(props)).to.throw(/conflict/);
    });
  });

  describe('merge', () => {
    it('merges relations', () => {
      const createQuery = merge(
        relation('fooId', 'foo', '_id'),
        relation('barId', 'bar', '_id')
      );
      const props = {
        foo: { _id: 'foo:1' },
        bar: { _id: 'bar:1' },
      };
      const expectedQuery = {
        $or: [
          { fooId: 'foo:1' },
          { barId: 'bar:1' },
        ],
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('merges relations and query objects', () => {
      const createQuery = merge(
        relation('fooId', 'foo', '_id'),
        { barId: 'bar:1' }
      );
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedQuery = {
        $or: [
          { fooId: 'foo:1' },
          { barId: 'bar:1' },
        ],
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('accepts any props => query function', () => {
      const createQuery = merge(
        relation('fooId', 'foo', '_id'),
        props => ({ rating: { $gte: props.rating } })
      );
      const props = {
        foo: { _id: 'foo:1' },
        rating: 5,
      };
      const expectedQuery = {
        $or: [
          { fooId: 'foo:1' },
          { rating: { $gte: 5 } },
        ],
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns false if one relation returns false', () => {
      const createQuery = merge(
        relation('fooId', 'foo', '_id'),
        relation('barId', 'bar', '_id')
      );
      const props = {
        // no bar
        foo: { _id: 'foo:1' },
      };
      const expectedQuery = false;
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('returns false if string is passed', () => {
      const createQuery = merge(
        relation('fooId', 'foo', '_id'),
        'bar:2'
      );
      const props = {
        // no bar
        foo: { _id: 'foo:1' },
      };
      const expectedQuery = false;
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });

    it('allows merge on the same field', () => {
      const createQuery = merge(
        relation('fooId', 'foo', '_id'),
        relation('fooId', 'bar', 'fooId')
      );
      const props = {
        foo: { _id: 'foo:1' },
        bar: { _id: 'bar:1', fooId: 'foo:2' },
      };
      const expectedQuery = {
        $or: [
          { fooId: 'foo:1' },
          { fooId: 'foo:2' },
        ],
      };
      expect(createQuery(props)).to.deep.equal(expectedQuery);
    });
  });

  const createFakeCollection = name => ({
    _name: name,
    find: sinon.stub().returns({ cursor: true, fetch: () => ([{ _id: `${name}:1` }]) }),
  });


  const BarCollection = createFakeCollection('bar');
  describe('findOne', () => {
    it('finds document and merges it into props', () => {
      BarCollection.find.reset();
      const createQuery = relation('fooId', 'foo', '_id');
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: { _id: 'bar:1' },
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const newProps = findOne('bar', BarCollection, createQuery)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery)).to.equal(true);
    });

    it('accepts object as relation', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: { _id: 'bar:1' },
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const newProps = findOne('bar', BarCollection, createQuery)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery)).to.equal(true);
    });

    it('accepts object as options', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const createOptions = { sort: { createdAt: -1 } };
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: { _id: 'bar:1' },
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const expectedOptions = {
        sort: { createdAt: -1 },
        limit: 1, // added by findOne
      };
      const newProps = findOne('bar', BarCollection, createQuery, createOptions)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery, expectedOptions)).to.equal(true);
    });

    it('overwrites limit in options', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const createOptions = { sort: { createdAt: -1 }, limit: 10 };
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: { _id: 'bar:1' },
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const expectedOptions = {
        sort: { createdAt: -1 },
        limit: 1, // added by findOne
      };
      const newProps = findOne('bar', BarCollection, createQuery, createOptions)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery, expectedOptions)).to.equal(true);
    });

    it('accepts function props => options as options', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const createOptions = props => ({ skip: props.itemNumber });
      const props = {
        foo: { _id: 'foo:1' },
        itemNumber: 5,
      };
      const expectedProps = {
        // {...props}
        bar: { _id: 'bar:1' },
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const expectedOptions = {
        skip: 5,
        limit: 1, // added by findOne
      };
      const newProps = findOne('bar', BarCollection, createQuery, createOptions)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery, expectedOptions)).to.equal(true);
    });

    it('merges false if relation is invalid', () => {
      BarCollection.find.reset();
      const createQuery = false;
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: false,
      };
      const newProps = findOne('bar', BarCollection, createQuery)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.called).to.equal(false);
    });

    it('merges false if options is invalid', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const createOptions = false;
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: false,
      };
      const newProps = findOne('bar', BarCollection, createQuery, createOptions)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.called).to.equal(false);
    });

    it('saves its cursors on the collection name', () => {
      const createQuery = { fooId: 'foo:1' };
      const props = {
        foo: { _id: 'foo:1' },
      };
      const newProps = findOne('bar', BarCollection, createQuery)(props);
      // eslint-disable-next-line no-underscore-dangle
      expect(newProps._cursors.bar).to.have.length(1);
    });
  });

  describe('find', () => {
    it('finds documents and merges them into props', () => {
      BarCollection.find.reset();
      const createQuery = relation('fooId', 'foo', '_id');
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: [{ _id: 'bar:1' }],
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const newProps = find('bar', BarCollection, createQuery)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery)).to.equal(true);
    });

    it('accepts object as relation', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: [{ _id: 'bar:1' }],
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const newProps = find('bar', BarCollection, createQuery)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery)).to.equal(true);
    });

    it('accepts object as options', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const createOptions = { sort: { createdAt: -1 } };
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: [{ _id: 'bar:1' }],
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const expectedOptions = {
        sort: { createdAt: -1 },
      };
      const newProps = find('bar', BarCollection, createQuery, createOptions)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery, expectedOptions)).to.equal(true);
    });

    it('allows limit in options', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const createOptions = { sort: { createdAt: -1 }, limit: 10 };
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: [{ _id: 'bar:1' }],
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const expectedOptions = {
        sort: { createdAt: -1 },
        limit: 10,
      };
      const newProps = find('bar', BarCollection, createQuery, createOptions)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery, expectedOptions)).to.equal(true);
    });

    it('accepts function props => options as options', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const createOptions = props => ({ skip: props.itemNumber });
      const props = {
        foo: { _id: 'foo:1' },
        itemNumber: 5,
      };
      const expectedProps = {
        // {...props}
        bar: [{ _id: 'bar:1' }],
      };
      const expectedQuery = {
        fooId: 'foo:1',
      };
      const expectedOptions = {
        skip: 5,
      };
      const newProps = find('bar', BarCollection, createQuery, createOptions)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.calledWith(expectedQuery, expectedOptions)).to.equal(true);
    });

    it('merges empty array if relation is invalid', () => {
      BarCollection.find.reset();
      const createQuery = false;
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: [],
      };
      const newProps = find('bar', BarCollection, createQuery)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.called).to.equal(false);
    });

    it('merges empty array if options is invalid', () => {
      BarCollection.find.reset();
      const createQuery = { fooId: 'foo:1' };
      const createOptions = false;
      const props = {
        foo: { _id: 'foo:1' },
      };
      const expectedProps = {
        // {...props}
        bar: [],
      };
      const newProps = find('bar', BarCollection, createQuery, createOptions)(props);
      expect(newProps.bar).to.deep.equal(expectedProps.bar);
      expect(BarCollection.find.called).to.equal(false);
    });

    it('saves its cursors on the collection name', () => {
      const createQuery = { fooId: 'foo:1' };
      const props = {
        foo: { _id: 'foo:1' },
      };
      const newProps = find('bar', BarCollection, createQuery)(props);
      // eslint-disable-next-line no-underscore-dangle
      expect(newProps._cursors.bar).to.have.length(1);
    });
  });
});
